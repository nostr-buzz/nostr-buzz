// This is a simplified version of the toast component for use in our application

import { useState } from "react";

type ToastType = "default" | "success" | "error" | "warning";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (props: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
}

export function useToast(): ToastContextType {
  // This is a simplified version that doesn't actually show toasts
  // In a real app, you would implement a proper toast system
  
  const toast = (props: Omit<Toast, "id">): string => {
    const id = Math.random().toString(36).slice(2, 11);
    console.log("TOAST:", props.title, props.description);
    return id;
  };

  const dismiss = (id: string) => {
    console.log("Dismissed toast:", id);
  };

  return {
    toast,
    dismiss,
  };
}
