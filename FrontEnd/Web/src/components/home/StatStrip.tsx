import Image from "next/image";

interface StatItem {
  id: string;
  count: string;
  label: string;
  iconSrc: string;
}

const stats: StatItem[] = [
  {
    id: "live-jobs",
    count: "1,75,324",
    label: "Live Job",
    iconSrc: "/assets/Icon.png",
  },
  {
    id: "companies",
    count: "97,354",
    label: "Companies",
    iconSrc: "/assets/Icon (2).png",
  },
  {
    id: "candidates",
    count: "38,47,154",
    label: "Candidates",
    iconSrc: "/assets/Icon (1).png",
  },
  {
    id: "new-jobs",
    count: "7,532",
    label: "New Jobs",
    iconSrc: "/assets/Icon (3).png",
  },
];

export function StatStrip() {
  return (
    <section className="bg-gray-50 pb-16 pt-2">
      <div className="mx-auto max-w-[1320px] px-4 lg:px-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-5 rounded-lg bg-white p-5 shadow-elevated transition-all duration-200 hover:-translate-y-1 hover:shadow-lg border border-gray-100"
            >
              <div className="relative h-16 w-16 shrink-0 transition-transform duration-200 group-hover:scale-105">
                <Image
                  src={item.iconSrc}
                  alt={item.label}
                  width={64}
                  height={64}
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-gray-900">
                  {item.count}
                </div>
                <div className="text-sm font-normal text-gray-500">
                  {item.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
