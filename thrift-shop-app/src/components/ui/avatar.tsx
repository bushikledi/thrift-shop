"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      src: _src,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      alt: _alt = "",
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      fallback: _fallback,
      size = "md",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex items-center justify-center rounded-full bg-muted text-muted-foreground overflow-hidden",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement> & { src?: string }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
>(({ className, src, alt, ...props }, _ref) => {
  const [imgError, setImgError] = React.useState(false);

  if (!src || imgError) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { src: _, alt: __, ...restProps } = props as React.ComponentPropsWithoutRef<typeof Image>;
  return (
    <Image
      src={src}
      alt={alt || ""}
      fill
      className={cn("object-cover", className)}
      onError={() => setImgError(true)}
      {...restProps}
    />
  );
});
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center font-medium", className)}
      {...props}
    >
      {children}
    </div>
  );
});
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
