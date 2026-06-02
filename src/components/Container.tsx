interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className = "" }: ContainerProps) {
  return (
    <div className={`mx-auto max-w-[1080px] px-6 ${className}`}>
      {children}
    </div>
  );
}
