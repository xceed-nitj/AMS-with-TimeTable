import { Link } from "react-router-dom";
function NavBar() {
  return (
    <header className="bg-slate-200 shadow-md">
      <div className="flex justify-between p-3 items-center mx-auto max-w-6xl">
        <Link to="/">
          <h1 className="text-sm font-bold sm:text-xl flex flex-wrap">
            <span className="font-semibold text-[#10152b]">NITJ</span>
            <span className="text-[#10152b]font-semibold">Conference</span>
          </h1>
        </Link>

        <ul className=" items-center gap-4 hidden sm:flex">
          <Link to="/">
            <li className="text-[#10152b]hover:underline">Home</li>
          </Link>
          <Link to="/author">
            <li className="text-[#10152b]hover:underline">Author</li>
          </Link>
          <Link to="/editor">
            <li className="text-[#10152b]hover:underline">Editor</li>
          </Link>
        </ul>
      </div>
    </header>
  );
}

export default NavBar;
