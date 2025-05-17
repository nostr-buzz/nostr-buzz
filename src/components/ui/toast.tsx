import * as React from "react";
import { CheckCircle, X, AlertCircle, AlertTriangle } from "lucide-react";

type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  type?: "default" | "success" | "error" | "warning";
  duration?: number;
  onDismiss: (id: string) => void;
};

export const Toast: React.FC<ToastProps> = ({
  id,
  title,
  description,
  type = "default",
  duration = 5000,
  onDismiss,
}) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };

  const getToastClasses = () => {
    const baseClasses = "pointer-events-auto flex w-full max-w-md rounded-md shadow-lg";
    
    switch (type) {
      case "success":
        return `${baseClasses} bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800`;
      case "error":
        return `${baseClasses} bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800`;
      case "warning":
        return `${baseClasses} bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800`;
      default:
        return `${baseClasses} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700`;
    }
  };

  return (
    <div className={getToastClasses()}>
      <div className="flex-1 p-4">
        <div className="flex items-start">
          {getIcon() && <div className="flex-shrink-0 mr-3">{getIcon()}</div>}
          <div>
            {title && (
              <h3 className="text-sm font-medium">
                {title}
              </h3>
            )}
            {description && (
              <div className="mt-1 text-sm text-muted-foreground">
                {description}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onDismiss(id)}
          className="flex items-center justify-center w-10 h-10 rounded-tr-md rounded-br-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
};
