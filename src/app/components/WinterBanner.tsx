import { EDITION } from '@/lib/edition';

const WORD_COLORS = ['#5FA8DC', '#FFFFFF', '#E2493A', '#4CAF5E', '#F6B817', '#5FA8DC'];

/** Top banner: "KREJT N'SHESH" + winter pattern / "WINTER EDITION" + date. */
export function WinterBanner() {
  const word = EDITION.editionWord.split('');

  return (
    <header
      aria-label={`${EDITION.campaign} — ${EDITION.editionWord} ${EDITION.editionLabel} ${EDITION.date}`}
      className="flex w-full max-w-[1080px] flex-col gap-[6px] bg-transparent sm:gap-[10px]"
    >
      <div className="flex h-[62px] border-[3px] border-[#141414] bg-[#141414] sm:h-[110px] sm:border-[4px] lg:h-[150px] lg:border-[5px]">
        <div className="flex flex-none items-center bg-[#141414] px-3 pt-[3px] sm:px-6 lg:px-[30px] lg:pt-[6px]">
          <span className="whitespace-nowrap bg-transparent font-malkie-slab text-[40px] leading-none text-white sm:text-[72px] lg:text-[104px]">
            {EDITION.campaign}
          </span>
        </div>
        <div aria-hidden="true" className="winter-pattern-a min-w-[40px] flex-1" />
      </div>

      <div className="flex h-[44px] gap-2 bg-transparent sm:h-[72px] sm:gap-3 lg:h-[96px] lg:gap-[14px]">
        <div className="flex min-w-0 flex-1 border-[3px] border-[#141414] bg-[#141414] sm:border-[4px] lg:border-[5px]">
          <div aria-hidden="true" className="winter-pattern-b min-w-[24px] flex-1" />
          <div className="flex flex-none items-center gap-[6px] bg-[#141414] px-2 font-barlow-condensed text-[28px] font-semibold leading-none tracking-[0.03em] sm:gap-3 sm:px-5 sm:text-[48px] lg:gap-4 lg:px-[26px] lg:text-[64px]">
            <span className="bg-transparent">
              {word.map((letter, i) => (
                <span key={i} className="bg-transparent" style={{ color: WORD_COLORS[i % WORD_COLORS.length] }}>
                  {letter}
                </span>
              ))}
            </span>
            <span className="bg-transparent text-white">{EDITION.editionLabel}</span>
          </div>
        </div>
        <div className="flex flex-none items-center bg-transparent font-barlow-condensed text-[34px] font-extrabold leading-none tracking-[-0.01em] text-[#141414] sm:text-[68px] lg:text-[96px]">
          {EDITION.date}
        </div>
      </div>
    </header>
  );
}

/** Bottom banner: winter pattern with the site address. */
export function WinterFooterBanner() {
  return (
    <div className="winter-pattern-a flex h-[64px] w-full max-w-[1080px] items-center justify-center border-[3px] border-[#141414] sm:h-[90px] sm:border-[4px] lg:h-[112px] lg:border-[5px]">
      <span className="bg-[#141414] px-3 pb-[3px] pt-[6px] font-malkie-slab text-[24px] leading-none text-white sm:px-5 sm:text-[40px] lg:px-[26px] lg:pb-[6px] lg:pt-[10px] lg:text-[52px]">
        prishtinafestive.com
      </span>
    </div>
  );
}
