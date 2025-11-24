interface PageBannerProps {
  title: string;
  subtitle: string;
}

function PageBanner({ title, subtitle }: PageBannerProps) {
  return (
    <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">{title}</h1>
        <p className="text-lg md:text-xl text-indigo-100">{subtitle}</p>
      </div>
    </div>
  );
}

export default PageBanner;
