"use client"

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { IoCloseOutline } from "react-icons/io5"

import { Drawer as DrawerPrimitive } from "vaul"
import { useMediaQuery } from "@/utils/hooks/useMediaQuery"

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
  }
const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[150] bg-[#33314680]  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-[151] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <IoCloseOutline
          className="w-8 h-8 cursor-pointer text-[#fcfcfc] hover:bg-[#26282c] transition-all  rounded-full"
        />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-[150] bg-[#33314680]", className)}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-[150] mt-24 flex h-auto flex-col border-[#121418] outline-none",
        className
      )}
      {...props}
    >
      <div className="mx-auto h-1 w-10 -mt-2 mb-2 rounded-full bg-gray-400" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
))
DrawerContent.displayName = "DrawerContent"


interface BaseProps {
    children: React.ReactNode
  }
  
  interface RootAdaptiveModalProps extends BaseProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
  
  interface AdaptiveModalProps extends BaseProps {
    className?: string
    asChild?: true
  }
  
  const desktop = "(min-width: 640px)"
  
  const AdaptiveModal = ({ children, ...props }: RootAdaptiveModalProps) => {
    const isDesktop = useMediaQuery(desktop)
    const AdaptiveModal = isDesktop ? Dialog : Drawer
  
    return <AdaptiveModal {...props}>{children}</AdaptiveModal>
  }
  
  const AdaptiveModalTrigger = ({ className, children, ...props }: AdaptiveModalProps) => {
    const isDesktop = useMediaQuery(desktop)
    const AdaptiveModalTrigger = isDesktop ? DialogTrigger : DrawerTrigger
  
    return (
      <AdaptiveModalTrigger className={className} {...props}>
        {children}
      </AdaptiveModalTrigger>
    )
  }
  
  const AdaptiveModalClose = ({ className, children, ...props }: AdaptiveModalProps) => {
    const isDesktop = useMediaQuery(desktop)
    const AdaptiveModalClose = isDesktop ? DialogClose : DrawerClose
  
    return (
      <AdaptiveModalClose className={className} {...props}>
        {children}
      </AdaptiveModalClose>
    )
  }
  
  const AdaptiveModalContent = ({ className, children, ...props }: AdaptiveModalProps) => {
    const isDesktop = useMediaQuery(desktop)
    const AdaptiveModalContent = isDesktop ? DialogContent : DrawerContent
  
    return (
      <AdaptiveModalContent className={className} {...props}>
        {children}
      </AdaptiveModalContent>
    )
  }
  
  export {
    AdaptiveModal,
    AdaptiveModalTrigger,
    AdaptiveModalClose,
    AdaptiveModalContent
  }