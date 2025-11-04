import * as React from "react";

import { cn } from "@/lib/utils";

interface CustomInputProps extends React.ComponentProps<"input"> {
    error?: string | null;
}

const Input = React.forwardRef<HTMLInputElement, CustomInputProps>(
    ({ className, type, error, ...props }, ref) => {

        const baseClasses =
            "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

        const errorClasses = error
            ? "border-destructive focus-visible:ring-destructive" // 错误状态的样式
            : "border-input"; // 默认/正常状态的样式

        return (
            <div className="flex flex-col w-full">
                <input
                    type={type}
                    className={cn(baseClasses, errorClasses, className, "h-12")}
                    ref={ref}
                    {...props}
                />

                {error && (
                    <p className="text-xs text-destructive mt-1 ml-1">{error}</p>
                )}
            </div>
        );
    }
);
Input.displayName = "Input";

export { Input };
