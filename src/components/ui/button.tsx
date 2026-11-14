import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#092B63] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#092B63] text-white shadow-sm hover:bg-[#123D82] active:bg-[#071F48]",
        secondary:
          "bg-[#2563EB] text-white shadow-sm hover:bg-blue-700 active:bg-blue-800",
        light:
          "bg-[#EAF2FF] text-[#092B63] hover:bg-[#D5E5FF] font-bold",
        brand:
          "bg-[#092B63] text-white shadow-sm hover:bg-[#123D82]",
        destructive:
          "bg-[#DC2626] text-white shadow-sm hover:bg-red-700 active:bg-red-800",
        outline:
          "border border-[#E2E8F0] bg-white text-[#172033] hover:bg-[#F6F8FC] hover:text-[#092B63] active:bg-[#EAF2FF]",
        ghost:
          "text-[#64748B] hover:bg-[#EAF2FF] hover:text-[#092B63]",
        link:
          "text-[#2563EB] underline-offset-4 hover:underline",
        success:
          "bg-[#16A34A] text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-6 text-base font-semibold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
