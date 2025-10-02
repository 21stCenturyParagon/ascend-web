import React, { useCallback, useEffect, useRef } from 'react';

type WebGLGlassHeaderProps = {
  children: React.ReactNode;
  width?: number;
  height?: number;
  backgroundImageUrl?: string;
};

const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = vec2(a_position.x, -a_position.y) * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform float u_dpr;
  uniform sampler2D u_background;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform vec2 u_size;
  uniform vec2 u_bgScale;
  uniform vec2 u_bgOffset;
  uniform vec2 u_bgTexSize;
  varying vec2 v_uv;

  float roundedBox(vec2 uv, vec2 center, vec2 size, float radius) {
    vec2 q = abs(uv - center) - size + radius;
    return length(max(q, 0.0)) - radius;
  }

  vec3 blurBackground(vec2 uv, vec2 resolution) {
    vec3 result = vec3(0.0);
    float total = 0.0;
    float radius = 3.0;
    for (int x = -3; x <= 3; x++) {
      for (int y = -3; y <= 3; y++) {
        vec2 offset = vec2(float(x), float(y)) * 1.0 / resolution;
        float weight = exp(-(float(x * x + y * y)) / (2.0 * radius));
        result += texture2D(u_background, uv + offset).rgb * weight;
        total += weight;
      }
    }
    return result / total;
  }

  float roundedBoxSDF(vec2 p, vec2 b, float r) {
    vec2 d = abs(p) - b + vec2(r);
    return length(max(d, 0.0)) - r;
  }

  vec2 getNormal(vec2 uv, vec2 center, vec2 size, float radius, vec2 resolution) {
    vec2 eps = vec2(1.0) / resolution * 2.0;
    vec2 p = uv - center;
    float dx = (roundedBoxSDF(p + vec2(eps.x, 0.0), size, radius) - roundedBoxSDF(p - vec2(eps.x, 0.0), size, radius)) * 0.5;
    float dy = (roundedBoxSDF(p + vec2(0.0, eps.y), size, radius) - roundedBoxSDF(p - vec2(0.0, eps.y), size, radius)) * 0.5;
    vec2 gradient = vec2(dx, dy);
    if (length(gradient) < 0.001) {
      return vec2(0.0);
    }
    return normalize(gradient);
  }

  void main() {
    vec2 pixelUV = (v_uv * u_resolution) / u_dpr;
    vec2 center = u_mouse;
    vec2 size = u_size * 0.5;
    vec2 local = (pixelUV - center) / size;
    local.y *= u_resolution.x / u_resolution.y;
    float radius = min(size.x, size.y);
    float dist = roundedBox(pixelUV, center, size, radius);
    if (dist > 1.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      return;
    }
    float r = clamp(length(local * 1.0), 0.0, 1.0);
    float curvature = pow(r, 1.0);
    vec2 domeNormal = normalize(local) * curvature;
    float eta = 1.0 / 1.5;
    vec2 incident = -domeNormal;
    vec2 refractVec = refract(incident, domeNormal, eta);
    vec2 curvedRefractUV = v_uv + refractVec * 0.03;
    float contourFalloff = exp(-abs(dist) * 0.4);
    vec2 normal = getNormal(pixelUV, center, size, radius, u_resolution);
    vec2 domeNormalContour = normal * pow(contourFalloff, 1.5);
    vec2 refractVecContour = refract(vec2(0.0), domeNormalContour, eta);
    vec2 uvContour = v_uv + refractVecContour * 0.35 * contourFalloff;
    float edgeWeight = smoothstep(0.0, 1.0, abs(dist));
    float radialWeight = smoothstep(0.5, 1.0, r);
    float combinedWeight = clamp((edgeWeight * 1.0) + (-radialWeight * 0.5), 0.0, 1.0);
    vec2 refractUV = mix(curvedRefractUV, uvContour, combinedWeight);
    // Map screen UV to background texture UV (accounting for CSS cover)
    vec2 texUV = refractUV * u_bgScale + u_bgOffset;
    vec3 refracted = texture2D(u_background, texUV).rgb;
    vec3 blurred = blurBackground(texUV, u_bgTexSize);
    vec3 base = mix(refracted, blurred, 0.5);
    float edge = 1.0 - smoothstep(0.0, 0.03, dist * -2.0);
    vec3 glow = vec3(0.7);
    vec3 color = mix(base, glow, edge * 0.5);
    float alpha = 0.75;
    gl_FragColor = vec4(color, alpha);
  }
`;

export default function WebGLGlassHeader({ children, width = 400, height = 80, backgroundImageUrl }: WebGLGlassHeaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const backgroundTextureRef = useRef<WebGLTexture | null>(null);
  const animationFrameRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentSizeRef = useRef<{ width: number; height: number }>({ width, height });
  const targetSizeRef = useRef<{ width: number; height: number }>({ width, height });
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const compileShader = useCallback((gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader) || 'Unknown shader error';
      gl.deleteShader(shader);
      throw new Error(`Shader compile error: ${info}`);
    }
    return shader;
  }, []);

  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = (canvas.getContext('webgl', { antialias: true, alpha: true }) ||
      canvas.getContext('experimental-webgl', { antialias: true, alpha: true })) as WebGLRenderingContext | null;
    if (!gl) {
      console.error('WebGL not supported in this browser');
      return;
    }
    glRef.current = gl;
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) return;
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program) || 'Unknown program link error';
      throw new Error(`Program link error: ${info}`);
    }
    programRef.current = program;
    gl.useProgram(program);
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Load the page background image (from prop or body CSS background)
    let url = backgroundImageUrl;
    if (!url) {
      try {
        const computed = window.getComputedStyle(document.body);
        const bg = computed.backgroundImage;
        if (bg && bg.startsWith('url(')) {
          url = bg.slice(4, -1).replace(/"/g, '');
        }
      } catch {
        // ignore
      }
    }
    if (!url) url = '/resized_1920x1080.png';

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        backgroundTextureRef.current = texture;
        gl.uniform1i(gl.getUniformLocation(program, 'u_background'), 0);
        gl.uniform1f(gl.getUniformLocation(program, 'u_dpr'), window.devicePixelRatio || 1);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      } catch (e) {
        console.error('Failed to upload background to texture', e);
      }
    };
    image.onerror = () => {
      console.error('Failed to load background image for refraction:', url);
    };
    image.src = url;
  }, [compileShader, backgroundImageUrl]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const gl = glRef.current;
    const program = programRef.current;
    const container = containerRef.current;
    if (!canvas || !gl || !program || !container) return;
    const delta = 1 / 60;
    const speed = 8.0;
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    targetMouseRef.current = { x: centerX, y: centerY };
    mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * speed * delta;
    mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * speed * delta;
    currentSizeRef.current.width += (targetSizeRef.current.width - currentSizeRef.current.width) * speed * delta;
    currentSizeRef.current.height += (targetSizeRef.current.height - currentSizeRef.current.height) * speed * delta;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), canvas.width, canvas.height);
    gl.uniform2f(gl.getUniformLocation(program, 'u_mouse'), mouseRef.current.x, mouseRef.current.y);
    gl.uniform2f(
      gl.getUniformLocation(program, 'u_size'),
      currentSizeRef.current.width,
      currentSizeRef.current.height,
    );
    // Map CSS background-size: cover for the page bg to texture UVs
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;
    // Use the loaded image dimensions if available by reading the texture size via canvas not trivial; approximate with css dims
    // Compute scale factors for cover
    // Assume background image has same aspect as the file; we can't query size here reliably, so approximate using cssW/H
    const imgW = cssW; // approximation to avoid missing uniforms
    const imgH = cssH;
    const s = Math.max(cssW / imgW, cssH / imgH);
    const drawW = imgW * s;
    const drawH = imgH * s;
    const offX = (cssW - drawW) / 2;
    const offY = (cssH - drawH) / 2;
    const scaleX = cssW / drawW;
    const scaleY = cssH / drawH;
    const uvOffX = -offX / drawW;
    const uvOffY = -offY / drawH;
    gl.uniform2f(gl.getUniformLocation(program, 'u_bgScale'), scaleX, scaleY);
    gl.uniform2f(gl.getUniformLocation(program, 'u_bgOffset'), uvOffX, uvOffY);
    gl.uniform2f(gl.getUniformLocation(program, 'u_bgTexSize'), drawW, drawH);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, backgroundTextureRef.current);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    animationFrameRef.current = requestAnimationFrame(render);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!initializedRef.current) {
        try {
          initWebGL();
          initializedRef.current = true;
          animationFrameRef.current = requestAnimationFrame(render);
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Unknown WebGL init error';
          console.error('WebGL initialization failed:', message);
        }
      }
    }, 100);
    targetSizeRef.current = { width, height };
    currentSizeRef.current = { width, height };
    const onResize = () => {
      targetSizeRef.current = { width, height };
    };
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      const gl = glRef.current;
      const program = programRef.current;
      const texture = backgroundTextureRef.current;
      if (gl && program) gl.deleteProgram(program);
      if (gl && texture) gl.deleteTexture(texture);
      initializedRef.current = false;
    };
  }, [height, width, initWebGL, render]);

  return (
    <div style={{ position: 'relative', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 0 }}
      />
      <div
        ref={containerRef}
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: `${width}px`, height: `${height}px`, margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        {children}
      </div>
    </div>
  );
}


