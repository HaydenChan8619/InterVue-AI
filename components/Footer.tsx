import Image from "next/image";
const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/*<div className="grid grid-cols-1 md:grid-cols-4 gap-8">*/}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <div className="text-white p-2 rounded-lg">
                <Image src='/logo.png' width={40} height={40} alt='InterVue AI Logo'
                className='pt-2'/>
              </div>
              <span className="text-xl font-bold">InterVue AI</span>
            </div>
            <p className="text-slate-400">
              AI-powered interview practice platform helping job seekers land their dream roles.
            </p>
          </div>
          
          {/*<div>
            <h4 className="text-lg font-bold mb-6">Product</h4>
            <ul className="space-y-3 text-slate-400">
              <li><a href="#" className="hover:text-white">Features</a></li>
              <li><a href="#" className="hover:text-white">Pricing</a></li>
              <li><a href="#" className="hover:text-white">Use Cases</a></li>
              <li><a href="#" className="hover:text-white">Demo</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-bold mb-6">Resources</h4>
            <ul className="space-y-3 text-slate-400">
              <li><a href="#" className="hover:text-white">Blog</a></li>
              <li><a href="#" className="hover:text-white">Interview Tips</a></li>
              <li><a href="#" className="hover:text-white">Help Center</a></li>
              <li><a href="#" className="hover:text-white">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-bold mb-6">Legal</h4>
            <ul className="space-y-3 text-slate-400">
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white">Cookie Policy</a></li>
              <li><a href="#" className="hover:text-white">Security</a></li>
            </ul>
          </div>*/}
        </div>
        
        <div className="border-t border-slate-800 mt-12 pt-8 text-left text-slate-500">
          <p>© {new Date().getFullYear()} InterVue AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;