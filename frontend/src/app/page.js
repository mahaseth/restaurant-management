import {
  FaUtensils, FaSearch, FaBars, FaArrowRight, FaCheck, FaQrcode,
  FaChevronRight, FaCashRegister, FaChartLine, FaExternalLinkAlt,
  FaArrowUp, FaChartPie, FaBoxes, FaUsersCog, FaStar, FaMapMarkerAlt,
  FaPhone, FaEnvelope, FaTwitter, FaFacebook, FaInstagram,
  FaLinkedin, FaHeart
} from "react-icons/fa";
import Header from "@/component/Header";

export default function Home() {
  return (
    <div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[400px] h-[400px] bg-sky-300/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left */}
            <div className="lg:w-3/5 text-center lg:text-left animate-fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-[1.05] tracking-tight">
                The Operating System for <br />
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Modern Restaurants</span>
              </h1>
              <p className="mt-8 text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Stop juggling multiple tools. Scale your business with our all-in-one
                <span className="font-semibold text-gray-900 dark:text-white"> POS</span>,
                <span className="font-semibold text-gray-900 dark:text-white"> QR Menu</span>, and
                <span className="font-semibold text-gray-900 dark:text-white"> Smart Inventory</span> system.
              </p>

              <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-5">
                <a
                  href="#"
                  className="px-8 py-4 bg-primary text-white rounded-2xl text-lg font-bold hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
                >
                  Get Started Free <FaArrowRight className="text-sm" />
                </a>

                <a
                  href="#"
                  className="px-8 py-4 border-2 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
                >
                  Live Demo
                </a>
              </div>

              <div className="mt-10 flex items-center justify-center lg:justify-start gap-6 text-gray-400">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <img key={i} src={`https://randomuser.me/api/portraits/men/${30 + i}.jpg`} className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-950 shadow-sm" alt="User" />
                  ))}
                </div>
                <div className="text-sm font-medium">
                  <span className="text-gray-900 dark:text-white font-bold">500+</span> Restaurants Trust Us
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="lg:w-2/5 flex justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-tr from-primary/30 to-accent/30 rounded-3xl blur-2xl opacity-50 floating"></div>
                <div className="relative bg-background/80 backdrop-blur-xl p-4 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 shadow-xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200"
                    className="rounded-2xl shadow-lg w-full h-auto object-cover max-h-[500px]"
                    alt="RestoSmart App"
                  />
                  {/* Floating Micro-UI elements */}
                  <div className="absolute -top-8 -right-4 bg-background/80 backdrop-blur-xl p-3 rounded-2xl shadow-xl animate-bounce" style={{ animationDuration: '4s' }}>
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500 p-2 rounded-full">
                        <FaCheck className="text-white text-xs" />
                      </div>
                      <div>
                        <div className="text-[11px] uppercase font-black text-gray-400 tracking-wider">New Order</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">$42.00 Table 05</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-6">
              Why Choose <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">RestoSmart?</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              We provide the most comprehensive toolset for modern restaurateurs,
              designed to increase efficiency and delight your customers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-background/80 backdrop-blur-xl p-8 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FaQrcode className="text-3xl text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Reduce Labor Costs</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Automate order taking with smart QR menus. Features **snapshot pricing** for history and **rate limiting** for maximum security and abuse prevention.
              </p>
              <div className="mt-6 flex items-center gap-2 text-primary font-bold text-sm cursor-pointer">
                View ROI Calculator <FaChevronRight className="text-[10px]" />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group bg-background/80 backdrop-blur-xl p-8 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <div className="bg-accent/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FaCashRegister className="text-3xl text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Maximize Table Turnover</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Speed up the ordering and payment process by 30%. Serve more guests without increasing your seating capacity.
              </p>
              <div className="mt-6 flex items-center gap-2 text-accent font-bold text-sm cursor-pointer">
                See How It Works <FaChevronRight className="text-[10px]" />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group bg-background/80 backdrop-blur-xl p-8 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <div className="bg-secondary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FaChartLine className="text-3xl text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Data-Driven Growth</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Uncover your most profitable dishes and peak hours with integrated analytics. Make informed decisions to scale.
              </p>
              <div className="mt-6 flex items-center gap-2 text-secondary font-bold text-sm cursor-pointer">
                Explore Dashboard <FaChevronRight className="text-[10px]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guest Experience Showcase */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
            <div className="max-w-xl">
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                Delight Your Guests with <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Exquisite Menus</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Showcase your culinary creations with high-resolution imagery. Guests can track orders in real-time with our **40-second auto-reload** technology.
              </p>
            </div>
            <a className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm" href="#">
              View Live Demo Menu <FaExternalLinkAlt className="text-xs" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: "Beautiful Visuals", desc: "Showcase food with high-res photos.", img: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?q=80&w=800" },
              { name: "Smart Upselling", desc: "Suggest add-ons automatically.", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800" },
              { name: "Instant Updates", desc: "Sync items and prices instantly.", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800" },
              { name: "Zero Commission", desc: "Keep 100% of your earnings.", img: "https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?q=80&w=800" }
            ].map((feature, i) => (
              <div key={i} className="group bg-background/80 backdrop-blur-xl rounded-3xl overflow-hidden border border-gray-200/50 dark:border-gray-800/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={feature.img}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    alt={feature.name}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                    {feature.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Management & Analytics Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2 order-2 lg:order-1">
              <div className="relative">
                <div className="absolute -inset-4 bg-accent/20 rounded-[3rem] blur-3xl opacity-30 floating" style={{ animationDelay: '1s' }}></div>
                <div className="bg-background/80 backdrop-blur-xl p-2 rounded-[2.5rem] border border-gray-200/50 dark:border-gray-800/50 shadow-xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200"
                    className="rounded-[2rem] shadow-lg w-full h-auto object-cover"
                    alt="Analytics Dashboard"
                  />
                </div>
                {/* Floating Micro-Insight */}
                <div className="absolute -bottom-6 -left-6 bg-background/80 backdrop-blur-xl p-5 rounded-2xl shadow-xl animate-fade-in" style={{ animationDelay: '0.5s' }}>
                  <div className="flex items-center gap-4">
                    <div className="bg-green-500/20 p-2 rounded-full text-green-500">
                      <FaArrowUp className="text-sm" />
                    </div>
                    <div>
                      <div className="text-[11px] uppercase font-black text-gray-500 tracking-wider">Revenue Growth</div>
                      <div className="text-xl font-black text-gray-900 dark:text-white">+24.8%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 order-1 lg:order-2">
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-8 leading-tight">
                Powerful Insights at <br />
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Your Fingertips</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-10 leading-relaxed">
                Our comprehensive dashboard gives you full control. **Aggregate multiple orders** into a single bill, settle payments, and generate **professional PDF receipts** instantly.
              </p>

              <div className="space-y-6">
                {[
                  { icon: "chart-pie", title: "Real-time Sales Tracking", desc: "Watch your revenue grow in real-time." },
                  { icon: "boxes", title: "Inventory Management", desc: "Never run out of top-selling ingredients." },
                  { icon: "users-cog", title: "Staff Performance", desc: "Track productivity and optimize scheduling." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 items-start">
                    <div className="mt-1 bg-white dark:bg-gray-800 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-800 text-primary">
                      {item.icon === 'chart-pie' && <FaChartPie className="text-lg" />}
                      {item.icon === 'boxes' && <FaBoxes className="text-lg" />}
                      {item.icon === 'users-cog' && <FaUsersCog className="text-lg" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1">{item.title}</h4>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 -translate-x-1/2 w-96 h-96 bg-accent/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-16">
            Trusted by <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Innovators</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { name: "Rahul Sharma", role: "Owner, Spice Garden", text: "The QR system is a game-changer. Our turnaround time improved by 40% in the first month.", image: "https://randomuser.me/api/portraits/men/32.jpg" },
              { name: "Sarah Jenkins", role: "Manager, The Blue Olive", text: "RestoSmart's interface is so intuitive that my staff didn't even need training. Highly recommend!", image: "https://randomuser.me/api/portraits/women/44.jpg" },
              { name: "David Chen", role: "Chef, Dragon Express", text: "The kitchen display system is robust and reliable. No more lost paper tickets or confusion.", image: "https://randomuser.me/api/portraits/men/85.jpg" }
            ].map((testi, i) => (
              <div key={i} className="bg-background/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-gray-200/50 dark:border-gray-800/50 shadow-xl relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-2xl overflow-hidden border-4 border-white dark:border-gray-900 shadow-lg">
                  <img src={testi.image} className="w-full h-full object-cover" alt={testi.name} />
                </div>
                <div className="mt-6 mb-4 text-yellow-500 flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => <FaStar key={star} className="text-xs" />)}
                </div>
                <p className="text-gray-600 dark:text-gray-400 italic mb-8 leading-relaxed">
                  “{testi.text}”
                </p>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">{testi.name}</h4>
                  <p className="text-xs font-semibold text-primary uppercase mt-1 tracking-wider">{testi.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-gray-900 text-white relative overflow-hidden rounded-[4rem] mx-6 mb-24">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="container mx-auto px-10 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div>
              <h2 className="text-5xl font-extrabold mb-8 leading-tight">
                Ready to transform <br />
                <span className="text-primary">your restaurant?</span>
              </h2>
              <p className="text-gray-300 text-lg mb-12 max-w-md">
                Join hundreds of successful businesses today. Contact us for a personalized demo or custom pricing.
              </p>

              <div className="space-y-8">
                {[
                  { icon: "map-marker-alt", label: "Headquarters", val: "Kathmandu, Nepal" },
                  { icon: "phone", label: "Call Us", val: "+977 9812345678" },
                  { icon: "envelope", label: "Email Support", val: "hello@restosmart.com" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-primary">
                      {item.icon === 'map-marker-alt' && <FaMapMarkerAlt className="text-xl" />}
                      {item.icon === 'phone' && <FaPhone className="text-xl" />}
                      {item.icon === 'envelope' && <FaEnvelope className="text-xl" />}
                    </div>
                    <div>
                      <div className="text-xs uppercase font-bold text-gray-400 tracking-widest mb-1">{item.label}</div>
                      <div className="text-lg font-bold">{item.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-background/20 backdrop-blur-xl p-10 rounded-[3rem] border border-gray-200/50 dark:border-gray-800/50 shadow-2xl">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-300 ml-2">Name</label>
                    <input className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-300 ml-2">Email</label>
                    <input className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors" placeholder="john@example.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-300 ml-2">Message</label>
                  <textarea className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors" rows="4" placeholder="How can we help you?"></textarea>
                </div>
                <button className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 shadow-lg shadow-primary/20">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-950 py-20 border-t border-gray-200/50 dark:border-gray-900">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <h2 className="text-2xl font-extrabold mb-6">
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">RestoSmart</span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                Elevating the dining experience through intelligent technology and seamless integration.
              </p>
              <div className="flex gap-4">
                {['twitter', 'facebook', 'instagram', 'linkedin'].map(social => (
                  <a key={social} href="#" className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 transition-all">
                    {social === 'twitter' && <FaTwitter />}
                    {social === 'facebook' && <FaFacebook />}
                    {social === 'instagram' && <FaInstagram />}
                    {social === 'linkedin' && <FaLinkedin />}
                  </a>
                ))}
              </div>
            </div>

            {['Product', 'Resources', 'Company'].map((title, i) => (
              <div key={i}>
                <h4 className="font-bold text-gray-900 dark:text-white mb-6 uppercase text-xs tracking-[0.2em]">{title}</h4>
                <ul className="space-y-4 font-medium text-gray-500 dark:text-gray-400">
                  {['Features', 'Pricing', 'Documentation', 'Privacy Policy'].map(link => (
                    <li key={link}><a href="#" className="hover:text-primary transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-12 border-t border-gray-100 dark:border-gray-900 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-gray-400 text-sm font-medium">
              © 2025 RestoSmart. Handcrafted for modern dining.
            </p>
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest">
              Built with <FaHeart className="text-primary animate-pulse" /> in Kathmandu
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
