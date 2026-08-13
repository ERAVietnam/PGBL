import Image from "next/image";
import Link from "next/link";
import { HomeIntro } from "./HomeIntro";
import { pgblHomeCards } from "@/lib/pgblHome";

export function PgblHomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden text-[var(--pgbl-text)]">
      <div className="fixed inset-0 -z-20 bg-[var(--pgbl-base)]">
        <Image
          src="/pgbl/assets/home-bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(180deg,rgba(13,38,32,.42)_0%,rgba(13,38,32,.30)_38%,rgba(13,38,32,.66)_78%,rgba(13,38,32,.94)_100%)]" />

      <Link href="/" className="pgbl-home-reveal pgbl-home-delay-brand fixed left-6 top-5 z-10 block">
        <Image
          src="/pgbl/assets/wordmark.png"
          alt="Phú Gia Bảo Lộc"
          width={1454}
          height={591}
          priority
          className="h-[34px] w-auto drop-shadow-[0_2px_8px_rgba(0,0,0,.5)]"
        />
      </Link>

      <section className="mx-auto flex min-h-screen max-w-[1120px] flex-col justify-end px-6 pb-28 pt-24 md:px-[26px]">
        <p className="pgbl-home-reveal pgbl-home-delay-1 mb-3 text-[12.5px] font-bold uppercase tracking-[3px] text-[var(--pgbl-accent)]">
          Khu đô thị · Bảo Lộc · Lâm Đồng
        </p>
        <h1 className="pgbl-home-reveal pgbl-home-delay-2 mb-3.5 text-[clamp(32px,6vw,58px)] font-extrabold leading-[1.03] drop-shadow-[0_2px_24px_rgba(0,0,0,.5)]">
          Phú Gia Bảo Lộc
        </h1>
        <p className="pgbl-home-reveal pgbl-home-delay-3 mb-7 max-w-2xl text-[clamp(15px,2vw,18px)] leading-[1.55] text-[var(--pgbl-text-muted)] drop-shadow-[0_1px_12px_rgba(0,0,0,.5)]">
          Trải nghiệm dự án bằng một chạm: tour 360° flycam, mặt bằng sản phẩm & tiện ích
          tương tác, thư viện ảnh và e-brochure lật trang.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pgblHomeCards.map((card, index) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                href={card.href}
                className={`pgbl-home-reveal group relative flex flex-col gap-2 rounded-2xl border border-[var(--pgbl-line)] bg-[rgba(14,40,33,.72)] p-[20px_18px_18px] text-[var(--pgbl-text)] shadow-[0_12px_38px_rgba(0,0,0,.32)] backdrop-blur-[14px] transition hover:-translate-y-1 hover:border-[rgba(159,220,76,.5)] hover:shadow-[0_20px_48px_rgba(0,0,0,.44)] ${card.dimmed ? "opacity-85" : ""}`}
                style={{ animationDelay: `${3.35 + index * 0.1}s` }}
              >
                {card.soon && (
                  <span className="absolute right-3.5 top-3.5 rounded-md bg-[var(--pgbl-gold)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.5px] text-[var(--pgbl-base)]">
                    Sắp có
                  </span>
                )}
                <span className="mb-1 flex h-[46px] w-[46px] items-center justify-center rounded-xl border border-[var(--pgbl-line)] bg-[linear-gradient(135deg,rgba(155,220,76,.16),rgba(95,229,190,.16))]">
                  <Icon className="h-6 w-6 text-[var(--pgbl-accent)]" strokeWidth={1.7} />
                </span>
                <h2 className="text-lg font-bold">{card.title}</h2>
                <p className="text-[12.5px] leading-6 text-[var(--pgbl-text-muted)]">{card.description}</p>
                <span className="mt-1.5 inline-flex items-center gap-2 text-[13.5px] font-bold text-[var(--pgbl-teal)]">
                  {card.action}
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <HomeIntro />
    </main>
  );
}
