'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signIn, useSession } from "next-auth/react";

const NavBar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const router = useRouter();
    const { data: session } = useSession();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogin = () => {
    const redirectTo =
        typeof window !== "undefined"
        ? window.location.origin + "/backgroundinfo"
        : "/backgroundinfo";

    signIn("google", { callbackUrl: redirectTo });
    };

    const handleGetHome = () => {
        router.push('/');
    }

    const goToDashboard = () => {
        router.push('/dashboard');
    };

    return (
        <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}>
        <div className="container mx-auto flex justify-between items-center">
        <div
        className="flex items-center space-x-2 cursor-pointer transition-transform duration-200 hover:scale-105"
        onClick={handleGetHome}
        >
        <div className="text-white p-2 rounded-lg transition-colors duration-200">
            {/*<svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
            </svg>*/}
            <Image src='/logo.png' width={40} height={40} alt='InterVue AI Logo'
            className='pt-2'/>
        </div>
        <span className="text-xl font-bold text-indigo-900">InterVue AI</span>
        </div>

            
            {/*<div className="hidden md:flex space-x-8">
            <a href="#process" className="text-indigo-900 hover:text-indigo-600 font-medium transition-transform duration-200 hover:scale-105">How It Works</a>
            <a href="#testimonials" className="text-indigo-900 hover:text-indigo-600 font-medium transition-transform duration-200 hover:scale-105">Testimonials</a>
            <a href="#" className="text-indigo-900 hover:text-indigo-600 font-medium transition-transform duration-200 hover:scale-105">Pricing</a>
            <a href="#" className="text-indigo-900 hover:text-indigo-600 font-medium transition-transform duration-200 hover:scale-105">About</a>
            </div> */}
            
            {session?.user ? (
            <div className="flex items-center space-x-3">
                {session.user.image && (
                <Image
                    src={session.user.image}
                    width={36}
                    height={36}
                    alt="Profile"
                    className="rounded-full"
                />
                )}
                <span className="font-medium text-indigo-900">
                {session.user.name}
                </span>
                <button
                    onClick={goToDashboard}
                    className="ml-2 bg-white border border-indigo-200 text-indigo-700 font-medium py-2 px-4 rounded-lg transition duration-200 transform hover:scale-105"
                    aria-label="Go to dashboard"
                    >
                    Dashboard
                </button>
            </div>
            ) : (
            <button
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-5 rounded-lg transition duration-200 transform hover:scale-105"
                onClick={handleLogin}
            >
                Sign In
            </button>
            )}
            </div>
        </nav>
    );
}

export default NavBar;