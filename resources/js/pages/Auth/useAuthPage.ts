import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAxios } from "@/hooks/useAxios";

export const useAuthPage = () => {
    const navigate = useNavigate();
    const { isAuth } = useAxios();
    const [slug, setSlug] = useState("");
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        localStorage.removeItem("tenantSlug");
    }, []);

    useEffect(() => {
        if (isAuth) return;
        const cached = localStorage.getItem("tenantSlug");
        if (cached) {
            navigate(`/${cached}/auth`, { replace: true });
        }
    }, [navigate, isAuth]);

    const goToClientAuth = (e: React.FormEvent) => {
        e.preventDefault();
        const value = slug.trim().toLowerCase();
        if (!value) return;
        navigate(`/${value}/auth`);
    };

    const handleDemoRequest = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return { slug, setSlug, goToClientAuth, handleDemoRequest, submitted };
};
