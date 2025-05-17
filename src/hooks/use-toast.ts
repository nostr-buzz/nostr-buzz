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
