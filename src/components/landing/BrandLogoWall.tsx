'use client';

const partnerBrands = [
  { name: 'CHITA LIVING', logo: '/landing/chita.png' },
  { name: 'Hisense', logo: '/landing/Hisense.png' },
  { name: 'Dreame Tech', logo: '/landing/dreme%20tech.png' },
  { name: 'Anker', logo: '/landing/anker.png' },
  { name: 'Jackery', logo: '/landing/jackery.png' },
  { name: 'Qlife', logo: '/landing/qlife.png' },
  { name: 'HBADA', logo: '/landing/hbada.png' },
  { name: 'Vtoman', logo: '/landing/vtoman.png' },
  { name: 'INMO', logo: '/landing/inmo.png' },
  { name: 'Anycubic', logo: '/landing/anycubic.png' },
  { name: 'Chikley', logo: '' },
  { name: 'DeerVally', logo: '/landing/deervalley.png' },
  { name: 'Pongbot', logo: '/landing/pongbot.png' },
  { name: 'ECOVACS', logo: '' },
  { name: 'Sihoo', logo: '' },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function BrandLogoWall() {
  return (
    <section
      id="brand-partners"
      className="relative overflow-hidden bg-[#fafaf7] px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center rounded-full border border-[#f97316]/20 bg-[#fff4ec] px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#c2410c]">
            Brand Network
          </div>

          <h2 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] text-[#101018] sm:text-5xl lg:text-[56px]">
            Brands We Work With
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#6b7280] sm:text-lg">
            Trusted by growing product, tech, lifestyle, smart home, and consumer
            brands looking for verified creator partnerships.
          </p>
        </div>

        {/* Minimal Logo Wall */}
        <div className="mx-auto mt-16 grid max-w-6xl grid-cols-2 items-start justify-items-center gap-x-12 gap-y-14 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {partnerBrands.map((brand) => (
            <figure
              key={brand.name}
              title={brand.name}
              className="group flex w-full flex-col items-center justify-start text-center"
            >
              <div className="flex h-16 w-full items-center justify-center">
                {brand.logo ? (
                  <img
                    src={brand.logo}
                    alt={`${brand.name} logo`}
                    className="max-h-12 max-w-[145px] object-contain opacity-75 grayscale mix-blend-multiply transition-all duration-300 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';

                      const fallback =
                        event.currentTarget.parentElement?.querySelector(
                          '.brand-logo-fallback'
                        );

                      fallback?.classList.remove('hidden');
                    }}
                  />
                ) : null}

                <span
                  className={`brand-logo-fallback flex h-14 w-14 items-center justify-center rounded-2xl border border-[#101018]/10 bg-[#101018] text-base font-black tracking-[-0.03em] text-white transition duration-300 group-hover:bg-[#f97316] ${
                    brand.logo ? 'hidden' : ''
                  }`}
                >
                  {getInitials(brand.name)}
                </span>
              </div>

              <figcaption className="mt-4 text-sm font-extrabold uppercase tracking-[0.14em] text-[#101018]/60 transition duration-300 group-hover:text-[#f97316]">
                {brand.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}