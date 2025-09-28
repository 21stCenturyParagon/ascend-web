import React, { useMemo, useState } from 'react';
import { PacmanLoader } from 'react-spinners';
import controllerImage from '../assets/controller.png';
import WebGLGlassHeader from '../components/WebGLGlassHeader';
import { addToWaitlist } from '../lib/supabase';

const LogoSVG: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg width="156" height="22" viewBox="0 0 156 22" fill="none" style={style} xmlns="http://www.w3.org/2000/svg">
    <path d="M14.4688 12.3051L20.943 1.01512C21.0676 0.797886 21.2988 0.663902 21.5493 0.663902H33.7655C34.3026 0.663902 34.639 1.24453 34.3718 1.71045L31.5226 6.67897C31.2554 7.14489 31.5918 7.72551 32.1289 7.72551H42.3167C42.8538 7.72551 43.1902 8.30614 42.923 8.77206L35.9513 20.9297C35.8267 21.147 35.5954 21.2809 35.345 21.2809H23.4424C22.9053 21.2809 22.569 20.7003 22.8362 20.2344L26.783 13.3517C27.0502 12.8858 26.7138 12.3051 26.1767 12.3051H14.4688L9.52313 20.9297C9.39856 21.147 9.16728 21.2809 8.91686 21.2809H0.699919C0.162831 21.2809 -0.173532 20.7003 0.0936448 20.2344L4.43921 12.6563C4.56378 12.4391 4.79506 12.3051 5.04548 12.3051H14.4688Z" fill="white"/>
    <path d="M145.992 21.585C144.455 21.585 143.146 21.2641 142.065 20.6223C140.984 19.9636 140.165 19.0431 139.608 17.8608C139.05 16.6785 138.772 15.2851 138.772 13.6806C138.772 12.0761 139.042 10.6827 139.583 9.50041C140.14 8.30124 140.934 7.38075 141.964 6.73895C143.011 6.09714 144.252 5.77624 145.688 5.77624C146.87 5.77624 147.884 6.00425 148.728 6.46027C149.562 6.89355 150.206 7.51594 150.661 8.32741C150.672 8.34766 150.693 8.36036 150.717 8.36036C150.752 8.36036 150.78 8.33183 150.78 8.29665V0.349411C150.78 0.15642 150.937 -3.05176e-05 151.13 -3.05176e-05H153.876C154.069 -3.05176e-05 154.226 0.15642 154.226 0.349411V17.4607C154.226 17.6537 154.382 17.8101 154.575 17.8101H155.599C155.792 17.8101 155.949 17.9666 155.949 18.1596V20.9315C155.949 21.1245 155.792 21.281 155.599 21.281H152.726C152.533 21.281 152.376 21.1245 152.376 20.9315V19.2236C152.376 19.0306 152.22 18.8742 152.027 18.8742H151.511C151.388 18.8742 151.274 18.9394 151.208 19.043C150.696 19.8395 150.021 20.4588 149.184 20.9009C148.306 21.357 147.242 21.585 145.992 21.585ZM146.575 18.6208C147.858 18.6208 148.88 18.2577 149.64 17.5314C150.4 16.8052 150.78 15.8256 150.78 14.5926V12.7686C150.78 11.5356 150.4 10.556 149.64 9.82976C148.88 9.1035 147.858 8.74037 146.575 8.74037C145.173 8.74037 144.092 9.1795 143.332 10.0578C142.589 10.936 142.217 12.1436 142.217 13.6806C142.217 15.2176 142.589 16.4252 143.332 17.3034C144.092 18.1817 145.173 18.6208 146.575 18.6208Z" fill="white"/>
    <path d="M122.099 21.281C121.906 21.281 121.75 21.1245 121.75 20.9315V9.90052C121.75 9.70753 121.593 9.55108 121.4 9.55108H120.351C120.158 9.55108 120.002 9.39463 120.002 9.20164V6.42969C120.002 6.2367 120.158 6.08025 120.351 6.08025H123.25C123.443 6.08025 123.599 6.2367 123.599 6.42969V8.13759C123.599 8.33058 123.756 8.48703 123.949 8.48703H124.47C124.59 8.48703 124.701 8.42473 124.769 8.325C125.296 7.54262 125.979 6.93793 126.817 6.51094C127.729 6.03803 128.827 5.80157 130.11 5.80157C132.137 5.80157 133.716 6.37582 134.848 7.52432C135.996 8.65592 136.57 10.176 136.57 12.0845V20.9315C136.57 21.1245 136.414 21.281 136.221 21.281H133.474C133.281 21.281 133.125 21.1245 133.125 20.9315V12.6926C133.125 11.4427 132.787 10.4885 132.112 9.82976C131.453 9.17106 130.473 8.84171 129.173 8.84171C127.872 8.84171 126.884 9.17106 126.209 9.82976C125.533 10.4885 125.195 11.4427 125.195 12.6926V20.9315C125.195 21.1245 125.039 21.281 124.846 21.281H122.099Z" fill="white"/>
    <path d="M111.649 21.585C110.045 21.585 108.643 21.2641 107.444 20.6223C106.261 19.9636 105.349 19.0346 104.708 17.8355C104.066 16.6363 103.745 15.2345 103.745 13.6299C103.745 12.0254 104.057 10.6405 104.682 9.47507C105.324 8.2928 106.228 7.38075 107.393 6.73895C108.558 6.09714 109.935 5.77624 111.523 5.77624C113.043 5.77624 114.352 6.08025 115.449 6.68828C116.547 7.27942 117.392 8.13235 117.983 9.24706C118.591 10.3449 118.895 11.6538 118.895 13.1739V14.0912C118.895 14.2842 118.738 14.4406 118.545 14.4406H107.424C107.217 14.4406 107.055 14.6188 107.085 14.8229C107.264 16.0245 107.713 16.9695 108.432 17.6581C109.226 18.4013 110.29 18.7728 111.624 18.7728C112.603 18.7728 113.406 18.5871 114.031 18.2155C114.586 17.8852 114.988 17.408 115.237 16.7841C115.293 16.6427 115.426 16.5434 115.578 16.5434H118.378C118.603 16.5434 118.77 16.7535 118.706 16.9694C118.294 18.3547 117.513 19.4541 116.361 20.2676C115.112 21.1458 113.541 21.585 111.649 21.585ZM107.244 11.6154C107.182 11.8288 107.349 12.0339 107.571 12.0339H115.207C115.417 12.0339 115.58 11.8501 115.54 11.6442C115.361 10.7184 114.959 9.99535 114.335 9.47507C113.625 8.86705 112.688 8.56303 111.523 8.56303C110.357 8.56303 109.394 8.86705 108.634 9.47507C107.972 9.98994 107.509 10.7034 107.244 11.6154Z" fill="white"/>
    <path d="M94.7412 21.585C93.1874 21.585 91.8278 21.2641 90.6624 20.6223C89.497 19.9636 88.5849 19.0431 87.9262 17.8608C87.2844 16.6785 86.9635 15.2851 86.9635 13.6806C86.9635 12.0761 87.2844 10.6827 87.9262 9.50041C88.568 8.31813 89.4716 7.40609 90.637 6.76428C91.8024 6.10558 93.1705 5.77624 94.7412 5.77624C96.6666 5.77624 98.2627 6.25759 99.5294 7.2203C100.692 8.10404 101.478 9.31513 101.886 10.8536C101.943 11.0685 101.777 11.2738 101.555 11.2738H98.7745C98.6209 11.2738 98.4868 11.1729 98.4332 11.0289C98.1702 10.3219 97.7502 9.77861 97.1733 9.39907C96.5484 8.97683 95.7377 8.76571 94.7412 8.76571C93.4069 8.76571 92.3513 9.19639 91.5744 10.0578C90.7975 10.9191 90.409 12.1268 90.409 13.6806C90.409 15.2345 90.7975 16.4421 91.5744 17.3034C92.3513 18.1648 93.4069 18.5955 94.7412 18.5955C96.7341 18.5955 97.9929 17.762 98.5176 16.0951C98.5655 15.9429 98.7036 15.834 98.8631 15.834H101.643C101.862 15.834 102.027 16.0323 101.978 16.245C101.601 17.8874 100.827 19.1692 99.6561 20.0902C98.3894 21.0867 96.7511 21.585 94.7412 21.585Z" fill="white"/>
    <path d="M79.227 21.585C77.0651 21.585 75.3593 21.1374 74.1094 20.2422C72.9574 19.4016 72.2861 18.2595 72.0955 16.8161C72.0689 16.6149 72.2302 16.4421 72.4332 16.4421H75.1238C75.2977 16.4421 75.4428 16.5706 75.4828 16.7398C75.6432 17.4191 76.0046 17.9363 76.5669 18.2915C77.2087 18.6968 78.1376 18.8995 79.3537 18.8995C81.448 18.8995 82.4952 18.2746 82.4952 17.0248C82.4952 16.5181 82.3347 16.1212 82.0138 15.834C81.6929 15.5469 81.1609 15.3358 80.4177 15.2007L77.0482 14.5673C74.1263 14.01 72.6654 12.625 72.6654 10.4124C72.6654 8.99372 73.2227 7.87056 74.3374 7.04296C75.4522 6.19848 76.9807 5.77624 78.923 5.77624C80.8822 5.77624 82.436 6.20692 83.5845 7.0683C84.6523 7.85754 85.2877 8.93038 85.4905 10.2868C85.5208 10.4896 85.3589 10.6658 85.1538 10.6658H82.4922C82.3305 10.6658 82.1917 10.5542 82.1432 10.4C81.9407 9.75654 81.5935 9.2709 81.1018 8.94305C80.5613 8.57148 79.7759 8.38569 78.7456 8.38569C77.8336 8.38569 77.1327 8.5377 76.6429 8.84171C76.1531 9.14573 75.9082 9.58486 75.9082 10.1591C75.9082 10.5813 76.0602 10.9276 76.3642 11.1978C76.6851 11.4512 77.1834 11.6454 77.8589 11.7805L81.2538 12.4392C82.7907 12.7263 83.9139 13.2246 84.6233 13.9339C85.3326 14.6264 85.6873 15.5638 85.6873 16.7461C85.6873 18.2661 85.1299 19.4569 84.0152 20.3182C82.9005 21.1627 81.3044 21.585 79.227 21.585Z" fill="white"/>
    <path d="M51.1926 21.281C50.9421 21.281 50.7729 21.0251 50.8711 20.7946L59.3138 0.972513C59.3687 0.843645 59.4952 0.760004 59.6353 0.760004H62.9223C63.0627 0.760004 63.1894 0.843958 63.2441 0.973186L71.6379 20.7953C71.7355 21.0257 71.5663 21.281 71.3161 21.281H68.502C68.3621 21.281 68.2357 21.1976 68.1807 21.069L65.9553 15.8687C65.9003 15.7401 65.7739 15.6567 65.6341 15.6567H56.7721C56.6322 15.6567 56.5059 15.7401 56.4508 15.8687L54.2255 21.069C54.1704 21.1976 54.0441 21.281 53.9042 21.281H51.1926ZM57.8852 12.1825C57.7884 12.4128 57.9576 12.6672 58.2073 12.6672H64.3255C64.5753 12.6672 64.7444 12.4128 64.6477 12.1825L61.3543 4.3399C61.3394 4.30452 61.3048 4.2815 61.2664 4.2815C61.2281 4.2815 61.1934 4.30452 61.1786 4.3399L57.8852 12.1825Z" fill="white"/>
  </svg>
);

const TwitterSVG: React.FC<{ size?: number }> = ({ size = 21 }) => (
  <svg width={size} height={size} viewBox="0 0 21 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.4979 9.08747L20.3156 0H18.463L11.6749 7.89052L6.25324 0H0L8.19861 11.9319L0 21.4615H1.85265L9.02109 13.1288L14.7468 21.4615H21L12.4974 9.08747H12.4979ZM9.96039 12.037L9.1297 10.8488L2.52019 1.39465H5.36576L10.6997 9.02449L11.5304 10.2126L18.4639 20.1303H15.6183L9.96039 12.0374V12.037Z" fill="white"/>
  </svg>
);

const InstagramSVG: React.FC<{ size?: number }> = ({ size = 23 }) => (
  <svg width={size} height={size} viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M5.5946 11.5C5.5946 8.23852 8.23852 5.5946 11.5 5.5946C14.7615 5.5946 17.4054 8.23852 17.4054 11.5C17.4054 14.7615 14.7615 17.4054 11.5 17.4054C8.23852 17.4054 5.5946 14.7615 5.5946 11.5ZM11.5 15.3333C9.3829 15.3333 7.66667 13.6171 7.66667 11.5C7.66667 9.3829 9.3829 7.66667 11.5 7.66667C13.6171 7.66667 15.3333 9.3829 15.3333 11.5C15.3333 13.6171 13.6171 15.3333 11.5 15.3333Z" fill="white"/>
    <path d="M17.6387 6.74126C18.4009 6.74126 19.0187 6.12345 19.0187 5.36129C19.0187 4.59912 18.4009 3.98126 17.6387 3.98126C16.8766 3.98126 16.2587 4.59912 16.2587 5.36129C16.2587 6.12345 16.8766 6.74126 17.6387 6.74126Z" fill="white"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M11.5 0C8.37679 0 7.98516 0.0132383 6.75856 0.0692044C5.53452 0.125033 4.69855 0.319454 3.96706 0.603758C3.21084 0.897603 2.56951 1.29083 1.93014 1.93014C1.29083 2.56951 0.897603 3.21084 0.603758 3.96706C0.319454 4.69855 0.125033 5.53452 0.0692044 6.75856C0.0132383 7.98516 0 8.37679 0 11.5C0 14.6232 0.0132383 15.0148 0.0692044 16.2414C0.125033 17.4655 0.319454 18.3015 0.603758 19.0329C0.897603 19.7892 1.29083 20.4305 1.93014 21.0699C2.56951 21.7092 3.21084 22.1024 3.96706 22.3963C4.69855 22.6805 5.53452 22.875 6.75856 22.9308C7.98516 22.9868 8.37679 23 11.5 23C14.6232 23 15.0148 22.9868 16.2414 22.9308C17.4655 22.875 18.3015 22.6805 19.0329 22.3963C19.7892 22.1024 20.4305 21.7092 21.0699 21.0699C21.7092 20.4305 22.1024 19.7892 22.3963 19.0329C22.6805 18.3015 22.875 17.4655 22.9308 16.2414C22.9868 15.0148 23 14.6232 23 11.5C23 8.37679 22.9868 7.98516 22.9308 6.75856C22.875 5.53452 22.6805 4.69855 22.3963 3.96706C22.1024 3.21084 21.7092 2.56951 21.0699 1.93014C20.4305 1.29083 19.7892 0.897603 19.0329 0.603758C18.3015 0.319454 17.4655 0.125033 16.2414 0.0692044C15.0148 0.0132383 14.6232 0 11.5 0ZM11.5 2.07207C14.5706 2.07207 14.9344 2.0838 16.147 2.13913C17.2682 2.19025 17.8771 2.3776 18.2824 2.53509C18.8192 2.74371 19.2023 2.99291 19.6047 3.39535C20.0071 3.79775 20.2563 4.18084 20.4649 4.71763C20.6224 5.12286 20.8097 5.73177 20.8609 6.85301C20.9162 8.06564 20.9279 8.42938 20.9279 11.5C20.9279 14.5706 20.9162 14.9344 20.8609 16.147C20.8097 17.2682 20.6224 17.8771 20.4649 18.2824C20.2563 18.8192 20.0071 19.2023 19.6047 19.6046C19.2023 20.0071 18.8192 20.2563 18.2824 20.4649C17.8771 20.6224 17.2682 20.8097 16.147 20.8609C14.9345 20.9162 14.5709 20.9279 11.5 20.9279C8.42915 20.9279 8.06551 20.9162 6.85302 20.8609C5.73178 20.8097 5.12286 20.6224 4.71763 20.4649C4.18084 20.2563 3.79775 20.0071 3.39535 19.6046C2.99295 19.2023 2.74371 18.8192 2.53509 18.2824C2.3776 17.8771 2.19026 17.2682 2.13913 16.147C2.0838 14.9344 2.07207 14.5706 2.07207 11.5C2.07207 8.42938 2.0838 8.06564 2.13913 6.85301C2.19026 5.73177 2.3776 5.12286 2.53509 4.71763C2.74371 4.18084 2.99291 3.79775 3.39535 3.39535C3.79775 2.99291 4.18084 2.74371 4.71763 2.53509C5.12286 2.3776 5.73178 2.19025 6.85302 2.13913C8.06564 2.0838 8.42938 2.07207 11.5 2.07207Z" fill="white"/>
  </svg>
);

const LinkedInSVG: React.FC<{ size?: number }> = ({ size = 21 }) => (
  <svg width={size} height={(size * 16) / 15} viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.9212 0.71921H1.51074C0.924194 0.712591 0.443194 1.18243 0.436035 1.76898V14.2312C0.442948 14.818 0.92391 15.2883 1.51074 15.2821H13.9212C14.5092 15.2894 14.992 14.8192 15.0001 14.2312V1.76808C14.9918 1.18038 14.5089 0.71056 13.9212 0.718217" fill="white"/>
    <path d="M10.6874 13.1277H12.8454L12.8463 9.31521C12.8463 7.4436 12.443 6.00494 10.2558 6.00494C9.41969 5.9739 8.63426 6.40528 8.21184 7.12755H8.18284V6.17781H6.11122V13.1274H8.26916V9.68949C8.26916 8.78291 8.44112 7.90487 9.56505 7.90487C10.673 7.90487 10.6874 8.94228 10.6874 9.74816V13.1277Z" fill="#A4A7E2"/>
    <path d="M2.42383 3.97575C2.42395 4.66739 2.98472 5.22796 3.67634 5.22784C4.00846 5.22778 4.32696 5.09578 4.56177 4.86089C4.79657 4.62599 4.92845 4.30744 4.92839 3.97531C4.92827 3.28367 4.3675 2.7231 3.67589 2.72322C2.98427 2.72335 2.4237 3.28412 2.42383 3.97575Z" fill="#A4A7E2"/>
    <path d="M2.59511 13.1277H4.75531V6.17781H2.59511V13.1277Z" fill="#A4A7E2"/>
  </svg>
);

export default function Landing() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    isTablet,
    isDesktop,
    isDesktopXL,
    headerMaxWidth,
  } = useMemo(() => {
    const width = window.innerWidth;
    const isTablet = width >= 768;
    const isDesktop = width >= 1024;
    const isDesktopXL = width >= 1440;
    const inputWrapperMaxWidth = isDesktopXL ? 700 : isDesktop ? 640 : isTablet ? 685 : 500;
    const headerMaxWidth = (isDesktop || isDesktopXL) ? Math.floor(inputWrapperMaxWidth * 0.9) : isTablet ? (isDesktop ? 1040 : 860) : Math.min(width - 48, 500);
    return { isTablet, isDesktop, isDesktopXL, headerMaxWidth };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError('Please enter a valid email address');
      return;
    }
    try {
      setLoading(true);
      const result = await addToWaitlist(trimmed);
      if (result.success) {
        setMessage("You're on the list! We'll notify you when Ascend launches.");
        setEmail('');
      } else {
        setError(result.error || 'Something went wrong');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Unable to join waitlist. ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'linear-gradient(210deg, #FFFFFF 2%, #9BA0F2 9%, #532AAB 25%, #29077F 35%, #010540 47%, #000004 60%)' }}>
      <header style={{ paddingTop: 44, paddingLeft: isTablet ? 80 : 24, paddingRight: isTablet ? 80 : 24, paddingBottom: 0, display: 'flex', justifyContent: 'center' }}>
        <WebGLGlassHeader width={headerMaxWidth} height={isTablet ? 84 : 64}>
          <div style={{ paddingLeft: isTablet ? 40 : 20, paddingRight: isTablet ? 40 : 20, paddingTop: isTablet ? 12 : 8, paddingBottom: isTablet ? 12 : 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: headerMaxWidth, overflow: 'hidden' }}>
            <LogoSVG style={{ width: isTablet ? 156 : 120, height: isTablet ? 22 : 17 }} />
            <div style={{ display: 'flex', gap: isTablet ? 24 : 16, alignItems: 'center' }}>
              <a href="https://twitter.com/ascend" target="_blank" rel="noreferrer" aria-label="Twitter"><TwitterSVG size={21} /></a>
              <a href="https://instagram.com/ascend" target="_blank" rel="noreferrer" aria-label="Instagram"><InstagramSVG size={23} /></a>
              <a href="https://linkedin.com/company/ascend" target="_blank" rel="noreferrer" aria-label="LinkedIn"><LinkedInSVG size={isTablet ? 24 : 21} /></a>
            </div>
          </div>
        </WebGLGlassHeader>
      </header>

      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', paddingLeft: 24, paddingRight: 24, paddingTop: 0, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#FFFFFF', fontSize: isDesktopXL ? 92 : isDesktop ? 80 : isTablet ? 72 : window.innerWidth > 400 ? 56 : 46, fontWeight: 900, letterSpacing: -3, marginTop: 0, marginBottom: 34, textTransform: 'uppercase', fontFamily: '"Big Shoulders Display", sans-serif' }}>COMING SOON</h1>
          <p style={{ color: '#FFFFFF', fontSize: isDesktopXL ? 22 : isDesktop ? 20 : isTablet ? 18 : window.innerWidth > 400 ? 16 : 15, lineHeight: isDesktopXL ? '30px' : isDesktop ? '28px' : isTablet ? '26px' : window.innerWidth > 400 ? '22px' : '20px', maxWidth: isDesktopXL ? 760 : isDesktop ? 700 : isTablet ? 606 : 400, margin: '0 auto', fontFamily: '"IBM Plex Sans", system-ui, sans-serif' }}>
            Ascend is building the infrastructure layer for<br />
            competitive eSports in South Asia powered by data,<br />
            scaled through automation, and built for players.
          </p>
        </div>
      </main>

      <section style={{ display: 'flex', justifyContent: 'center', paddingLeft: isTablet ? 80 : 24, paddingRight: isTablet ? 80 : 24, paddingBottom: isDesktop ? 110 : isTablet ? 96 : 72, position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: isDesktopXL ? 1200 : isDesktop ? 1040 : isTablet ? 860 : 680, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ color: '#FFFFFF', fontSize: isDesktop ? 22 : isTablet ? 20 : 18, fontWeight: 800, letterSpacing: 2, marginBottom: 20, textTransform: 'uppercase', fontFamily: '"Big Shoulders Display", sans-serif' }}>JOIN THE WAITLIST</div>
          <form onSubmit={onSubmit} style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 60, display: 'flex', width: '100%', maxWidth: isDesktopXL ? 700 : isDesktop ? 640 : isTablet ? 685 : 500, height: isDesktop ? 64 : isTablet ? 72 : 56, paddingLeft: isDesktop ? 24 : isTablet ? 22 : 16, paddingRight: 4, alignItems: 'center' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              aria-label="Email"
              disabled={loading}
              style={{ flex: 1, color: '#FFFFFF', fontSize: isDesktop ? 18 : isTablet ? 20 : 16, paddingRight: 10, background: 'transparent', border: 'none', outline: 'none', fontFamily: '"IBM Plex Sans", sans-serif', fontWeight: 400 }}
            />
            <button type="submit" disabled={loading} style={{ backgroundColor: '#532AAB', borderRadius: 60, paddingLeft: isDesktop ? 48 : isTablet ? 56 : 28, paddingRight: isDesktop ? 48 : isTablet ? 56 : 28, height: isDesktop ? 56 : isTablet ? 64 : 48, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: isDesktop ? 18 : isTablet ? 20 : 16, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1, fontFamily: '"IBM Plex Sans", system-ui, sans-serif' }}>
              {loading ? 'Please wait…' : 'Sign up'}
            </button>
          </form>
          {message && <div style={{ marginTop: 16, color: '#BBF7D0' }}>{message}</div>}
          {error && <div style={{ marginTop: 16, color: '#FCA5A5' }}>{error}</div>}
        </div>
        <div style={{ position: 'fixed', left: 0, bottom: 0, width: Math.min(isTablet ? 500 : 340, window.innerWidth * 0.6), height: Math.min(isTablet ? 500 : 340, window.innerWidth * 0.6), zIndex: 0, pointerEvents: 'none' }}>
          <img src={controllerImage} alt="controller" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'left bottom', display: 'block' }} />
        </div>
      </section>

      {loading && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
          <PacmanLoader color="#8B5CF6" loading={true} size={35} speedMultiplier={1} />
          <div style={{ color: '#FFFFFF', fontSize: 18, marginTop: 30, textAlign: 'center', letterSpacing: 2, textTransform: 'uppercase', fontFamily: '"Noto Sans", sans-serif' }}>Loading</div>
        </div>
      )}
    </div>
  );
}


