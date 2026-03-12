const stats = [
  { value: "500+", label: "Businesses" },
  { value: "$2.1M", label: "Software Portfolio" },
  { value: "209+", label: "Tools Included" },
  { value: "97%", label: "Satisfaction" },
  { value: "12+", label: "Industries" },
  { value: "$0/mo", label: "Licensing" },
];

export default function Stats() {
  return (
    <section className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-bold text-navy">{stat.value}</div>
              <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
