"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const PropertySearch = () => {
  const [address, setAddress] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) {
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder="Ange adress (t.ex. Storgatan 1, Stockholm)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
        </div>
        <Button type="submit" size="lg" className="px-8">
          Analysera
        </Button>
      </div>
    </form>
  );
};

export default PropertySearch;
