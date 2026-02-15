export function AsciiLogo() {
  return (
    <div className="flex items-center justify-center">
      <div className="">
        <pre className="text-terminal font-mono text-xs sm:text-sm leading-tight select-none text-start">
          {`
 ██╗     ███╗   ██╗ ██████╗██╗   ██╗██████╗ ██╗
 ██║     ████╗  ██║██╔════╝██║   ██║██╔══██╗██║
 ██║     ██╔██╗ ██║██║     ██║   ██║██████╔╝██║
 ██║     ██║╚██╗██║██║     ██║   ██║██╔══██╗██║
 ███████╗██║ ╚████║╚██████╗╚██████╔╝██║  ██║███████╗
 ╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝
`}
        </pre>
      </div>
    </div>
  );
}
