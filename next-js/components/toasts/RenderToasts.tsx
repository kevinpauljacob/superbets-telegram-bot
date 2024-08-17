import toast, { Toaster, useToasterStore } from "react-hot-toast";

export default function RenderToasts() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "#333",
          color: "#fff",
        },
      }}
    />
  );
}
