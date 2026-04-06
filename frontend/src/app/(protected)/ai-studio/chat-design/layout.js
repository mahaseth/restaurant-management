/**
 * Pull chat design into the viewport: offset (protected) main padding so the phone preview can use more height.
 */
export default function ChatDesignLayout({ children }) {
  return <div className="-mx-6 -mt-6 -mb-6 min-h-0 px-3 pb-1 pt-2 sm:px-5 sm:pb-2 sm:pt-3">{children}</div>;
}
