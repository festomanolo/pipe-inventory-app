
import { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Monitor, 
  Globe, 
  Code, 
  Zap, 
  Star,
  MessageCircle,
  ExternalLink,
  Sparkles,
  Rocket,
  Heart,
  Award
} from 'lucide-react';

const About = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const skills = [
    {
      icon: Smartphone,
      title: "Mobile Apps",
      description: "Native iOS & Android development with React Native, Flutter, and native technologies",
      gradient: "from-green-400 to-blue-500",
      delay: "0.2s"
    },
    {
      icon: Monitor,
      title: "Desktop Apps",
      description: "Cross-platform desktop applications using Electron.js and native frameworks",
      gradient: "from-purple-400 to-pink-500",
      delay: "0.4s"
    },
    {
      icon: Globe,
      title: "Web Applications",
      description: "Full-stack web development with modern frameworks and cutting-edge technologies",
      gradient: "from-blue-400 to-indigo-500",
      delay: "0.6s"
    },
    {
      icon: Code,
      title: "Festomanolo",
      description: "Expertise in advanced software architecture and scalable system design",
      gradient: "from-orange-400 to-red-500",
      delay: "0.8s"
    }
  ];

  const openWhatsApp = () => {
    window.open('https://wa.me/255784953866', '_blank');
  };

  const openWebsite = () => {
    window.open('https://festomanolo.xyz', '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="hero-section flex items-center justify-center relative">
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className={`transition-all duration-1000 ${isVisible ? 'fade-in' : 'opacity-0'}`}>
            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-primary/30 rounded-full float"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${5 + Math.random() * 3}s`
                  }}
                />
              ))}
            </div>

            <div className="mb-8 relative">
              <Sparkles className="h-16 w-16 text-primary mx-auto mb-6 pulse-glow" />
              <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
                Festomanolo
              </h1>
              <div className="flex items-center justify-center gap-3 mb-8">
                <Star className="h-6 w-6 text-yellow-400 rotate-360" />
                <p className="text-xl md:text-2xl text-muted-foreground font-medium">
                  Master of Digital Innovation
                </p>
                <Star className="h-6 w-6 text-yellow-400 rotate-360" />
              </div>
            </div>

            <div className="mb-12">
              <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
                Welcome to the pinnacle of UI/UX design and software development. With decades of experience 
                and infinite creativity, I craft digital experiences that transcend the ordinary and redefine 
                what's possible in the digital realm.
              </p>
            </div>

            {/* Call to Action */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button
                onClick={openWhatsApp}
                className="pipe-button whatsapp-link group"
              >
                <MessageCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                Connect on WhatsApp
                <ExternalLink className="h-4 w-4 opacity-70" />
              </button>
              <button
                onClick={openWebsite}
                className="pipe-button website-link group"
              >
                <Globe className="h-5 w-5 group-hover:scale-110 transition-transform" />
                Visit Website
                <ExternalLink className="h-4 w-4 opacity-70" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Award className="h-12 w-12 text-primary mx-auto mb-6 bounce-gentle" />
            <h2 className="text-4xl md:text-5xl font-bold mb-6 slide-up">
              Areas of Mastery
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto slide-up">
              Transforming ideas into extraordinary digital experiences across all platforms
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {skills.map((skill, index) => {
              const Icon = skill.icon;
              return (
                <div
                  key={index}
                  className="skill-card scale-in group"
                  style={{ animationDelay: skill.delay }}
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${skill.gradient} flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-500`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-center">{skill.title}</h3>
                  <p className="text-muted-foreground text-center leading-relaxed">
                    {skill.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto text-center">
          <Heart className="h-12 w-12 text-red-500 mx-auto mb-6 pulse-glow" />
          <h2 className="text-4xl md:text-5xl font-bold mb-8 fade-in">
            Let's Create Something Amazing
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto fade-in">
            Ready to bring your vision to life? Let's collaborate and build the future together.
          </p>

          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center max-w-md mx-auto">
            <a
              href="https://wa.me/255784953866"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-link whatsapp-link w-full group"
            >
              <MessageCircle className="h-6 w-6 text-green-500 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="font-semibold">WhatsApp</div>
                <div className="text-sm text-muted-foreground">+255 784 953 866</div>
              </div>
              <ExternalLink className="h-4 w-4 opacity-70" />
            </a>

            <a
              href="https://festomanolo.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-link website-link w-full group"
            >
              <Globe className="h-6 w-6 text-blue-500 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="font-semibold">Website</div>
                <div className="text-sm text-muted-foreground">festomanolo.xyz</div>
              </div>
              <ExternalLink className="h-4 w-4 opacity-70" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/50">
        <div className="container mx-auto text-center">
          <Rocket className="h-8 w-8 text-primary mx-auto mb-4 float" />
          <p className="text-muted-foreground">
            Crafted with infinite passion and cutting-edge technology
          </p>
          <p className="text-sm text-muted-foreground/70 mt-2">
            © 2024 Festomanolo. Redefining Digital Excellence.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default About;
