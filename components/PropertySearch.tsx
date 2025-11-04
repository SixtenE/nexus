"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface PropertySearchProps {
    analyzeText: string;
    searchPlaceholder: string;
}

const PropertySearch = ({ analyzeText, searchPlaceholder }: PropertySearchProps) => {

    const router = useRouter();
    const [address, setAddress] = useState("");
    const [addressError, setAddressError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedAddress = address.trim();

        if (!trimmedAddress) {
            setAddressError("Fältet får inte vara tomt.");
            return;
        }

        setAddressError(null);
        const encodedAddress = encodeURIComponent(trimmedAddress);
        router.push(`/dashboard?address=${encodedAddress}`);
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-2xl">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={address}
                        onChange={(e) => {
                            setAddress(e.target.value);
                            if (addressError) setAddressError(null);
                        }}
                        className="pl-10 h-12 text-lg"
                        error={addressError}
                    />
                </div>
                <Button type="submit" size="lg" className="px-8">
                    {analyzeText}
                </Button>
            </div>
        </form>
    );
};

export default PropertySearch;
