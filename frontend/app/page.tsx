"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // theme toggle
    const toggle = container.querySelector<HTMLDivElement>("#themeToggle");
    const handleToggle = () => {
      const html = document.documentElement;
      const current = html.getAttribute("data-theme");
      html.setAttribute("data-theme", current === "dark" ? "light" : "dark");
    };
    toggle?.addEventListener("click", handleToggle);

    // nav shadow on scroll
    const nav = container.querySelector<HTMLElement>("#mainNav");
    const handleScroll = () => {
      if (!nav) return;
      if (window.scrollY > 40) nav.classList.add("nav-scrolled");
      else nav.classList.remove("nav-scrolled");
    };
    window.addEventListener("scroll", handleScroll);

    // typing effect
    const question = "Why did you reach for a Map here instead of a plain object?";
    const qEl = container.querySelector<HTMLDivElement>("#typedQuestion");
    let qi = 0;
    let typeTimeout: ReturnType<typeof setTimeout>;
    function typeQuestion() {
      if (qEl && qi <= question.length) {
        qEl.innerHTML = question.slice(0, qi) + '<span class="typed-cursor"></span>';
        qi++;
        typeTimeout = setTimeout(typeQuestion, 28);
      }
    }
    const startTyping = setTimeout(typeQuestion, 1200);

    // scroll reveal
    const revealEls = container.querySelectorAll(".reveal");
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => revealObserver.observe(el));

    // animated counters
    function animateCounter(el: Element) {
      const target = parseInt(el.getAttribute("data-target") || "0", 10);
      const duration = 1400;
      const start = performance.now();
      function step(now: number) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target).toLocaleString();
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    const statEls = container.querySelectorAll(".stat-number");
    const statObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            statObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    statEls.forEach((el) => statObserver.observe(el));

    // mouse-follow glow on feature cards
    const cards = container.querySelectorAll<HTMLElement>(".feature-card");
    const handlers: Array<[HTMLElement, (e: MouseEvent) => void]> = [];
    cards.forEach((card) => {
      const handler = (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", e.clientX - rect.left + "px");
        card.style.setProperty("--my", e.clientY - rect.top + "px");
      };
      card.addEventListener("mousemove", handler);
      handlers.push([card, handler]);
    });

    return () => {
      toggle?.removeEventListener("click", handleToggle);
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(startTyping);
      clearTimeout(typeTimeout);
      revealObserver.disconnect();
      statObserver.disconnect();
      handlers.forEach(([card, handler]) => card.removeEventListener("mousemove", handler));
    };
  }, []);

  return (
    <div ref={containerRef}>
      <nav id="mainNav" className="sticky top-0 z-50 flex justify-between items-center px-12 py-5 transition-all">
        <div className="font-display text-xl font-medium">
          interview<span style={{ color: "var(--coral)" }}>room</span>
        </div>
        <div className="hidden md:flex gap-7 text-sm" style={{ color: "var(--muted)" }}>
          <a href="#features" className="hover:text-current transition-colors">Features</a>
          <a href="#how" className="hover:text-current transition-colors">How it works</a>
          <a href="#stats" className="hover:text-current transition-colors">Results</a>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm hidden sm:inline" style={{ color: "var(--muted)" }}>
                {user.email}
              </Link>
              <Link
                href="/dashboard"
                className="btn-secondary text-sm font-medium px-4 py-2 rounded-lg"
                style={{ border: "0.5px solid var(--border-strong)" }}
              >
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="text-sm"
                style={{ color: "var(--muted)" }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm hidden sm:inline" style={{ color: "var(--muted)" }}>
                Log in
              </Link>
              <Link
                href="/signup"
                className="btn-primary text-sm font-medium px-4 py-2 rounded-lg"
              >
                Sign up
              </Link>
            </>
          )}
          <div id="themeToggle" className="theme-toggle" role="button" aria-label="Toggle dark and light mode" />
        </div>
      </nav>

      <div className="relative overflow-hidden">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        <section className="relative z-10 max-w-3xl mx-auto px-6 pt-20 pb-14 text-center">
          <div
            className="font-mono text-xs uppercase tracking-wider inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full reveal in-view"
            style={{ color: "var(--periwinkle)", border: "0.5px solid var(--border-strong)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--teal)", animation: "pulse 1.6s ease-in-out infinite" }}
            />
            Practice out loud, before it counts
          </div>

          <h1 className="font-display font-medium leading-tight mt-5 mb-5" style={{ fontSize: "clamp(38px, 6vw, 66px)" }}>
            Interview practice that <em>actually</em> talks back
          </h1>

          <p className="max-w-xl mx-auto mb-9 leading-relaxed" style={{ color: "var(--muted)" }}>
            Write code, get asked real follow-up questions, and see exactly where you&apos;d lose points — before a real interviewer does.
          </p>

          <div className="flex gap-3 justify-center">
            <Link
              href={user ? "/dashboard" : "/signup"}
              className="btn-primary text-sm font-medium px-6 py-3.5 rounded-xl"
            >
              {user ? "Go to dashboard" : "Start a mock interview"}
            </Link>
            <a
              href="#how"
              className="btn-secondary text-sm font-medium px-6 py-3.5 rounded-xl"
              style={{ border: "0.5px solid var(--border-strong)" }}
            >
              See how it works
            </a>
          </div>

          <div className="max-w-2xl mx-auto mt-14">
            <div
              className="demo-shadow rounded-2xl p-5"
              style={{ background: "var(--panel)", border: "0.5px solid var(--border)" }}
            >
              <div
                className="flex justify-between items-center pb-3 font-mono text-xs"
                style={{ borderBottom: "0.5px solid var(--border)" }}
              >
                <span style={{ color: "var(--periwinkle)" }}>Q2 of 5</span>
                <span className="font-medium" style={{ color: "var(--paper)", fontFamily: "IBM Plex Sans, sans-serif" }}>
                  Frontend SDE-1
                </span>
                <span className="flex items-center gap-1.5" style={{ color: "var(--coral)" }}>
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--coral)", animation: "pulse 1.4s ease-in-out infinite" }}
                  />
                  04:32
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3.5">
                <div
                  className="font-mono text-xs rounded-lg p-3.5 leading-loose"
                  style={{ background: "var(--panel-2)", color: "var(--muted)" }}
                >
                  <div><span style={{ color: "var(--border-strong)" }}>1</span> <span style={{ color: "var(--periwinkle)" }}>function</span> groupByKey(items) {"{"}</div>
                  <div><span style={{ color: "var(--border-strong)" }}>2</span> &nbsp;&nbsp;<span style={{ color: "var(--periwinkle)" }}>const</span> map = <span style={{ color: "var(--periwinkle)" }}>new</span> Map();</div>
                  <div><span style={{ color: "var(--border-strong)" }}>3</span> &nbsp;&nbsp;<span style={{ color: "var(--coral)", opacity: 0.75 }}>{"// group items by their key"}</span></div>
                  <div><span style={{ color: "var(--border-strong)" }}>4</span> &nbsp;&nbsp;<span style={{ color: "var(--periwinkle)" }}>for</span> (<span style={{ color: "var(--periwinkle)" }}>const</span> item of items) {"{"}</div>
                  <div><span style={{ color: "var(--border-strong)" }}>5</span> &nbsp;&nbsp;&nbsp;&nbsp;...</div>
                  <div><span style={{ color: "var(--border-strong)" }}>6</span> &nbsp;&nbsp;{"}"}</div>
                </div>

                <div className="rounded-lg p-3.5 flex flex-col justify-between" style={{ background: "var(--panel-2)" }}>
                  <div>
                    <div className="font-mono text-xs font-medium mb-2" style={{ color: "var(--periwinkle)" }}>AI interviewer</div>
                    <div id="typedQuestion" className="font-display text-sm leading-relaxed" />
                  </div>
                  <Link
                    href={user ? "/dashboard" : "/signup"}
                    className="submit-btn mt-3 rounded-md py-2 text-sm text-center block"
                    style={{ border: "0.5px solid var(--border-strong)", color: "var(--paper)" }}
                  >
                    Try it yourself →
                  </Link>
                </div>
              </div>

              <div
                className="flex justify-between pt-2.5 font-mono text-[10.5px]"
                style={{ borderTop: "0.5px solid var(--border)", color: "var(--muted)" }}
              >
                <span>READY</span>
                <span>JetBrains Mono</span>
                <span>Session #14</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section id="stats" className="max-w-4xl mx-auto px-6 my-24">
        <div className="reveal grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { target: 12400, label: "Mock interviews run", color: "var(--coral)" },
            { target: 87, label: "% who felt more prepared", color: "var(--periwinkle)" },
            { target: 5, label: "Roles covered", color: "var(--teal)" },
            { target: 24, label: "Avg. minutes per session", color: "var(--amber)" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center rounded-2xl px-4 py-6"
              style={{ background: "var(--panel)", border: "0.5px solid var(--border)" }}
            >
              <div className="stat-number font-display text-4xl font-semibold" data-target={stat.target} style={{ color: stat.color }}>0</div>
              <div className="text-xs mt-1.5" style={{ color: "var(--muted)" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="max-w-4xl mx-auto px-6 my-24">
        <div className="reveal font-mono text-xs uppercase tracking-wider text-center mb-2.5" style={{ color: "var(--muted)" }}>
          What&apos;s different
        </div>
        <div className="reveal font-display text-center font-medium mb-12" style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>
          Not a question bank. A conversation.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { n: "01", title: "Real follow-ups", desc: "The AI reads your actual code and asks what a real interviewer would ask next.", accent: "var(--coral)" },
            { n: "02", title: "Live feedback", desc: "Feedback happens mid-interview, while it's still fresh, not three days later in an email.", accent: "var(--periwinkle)" },
            { n: "03", title: "Actionable report", desc: "A plain-language breakdown of what to practice next, not just a raw score.", accent: "var(--teal)" },
            { n: "04", title: "Any role, any level", desc: "Frontend, backend, or full-stack — question difficulty adapts to the role you pick.", accent: "var(--amber)" },
            { n: "05", title: "Session history", desc: "Every past interview is saved, so you can see whether you're actually improving.", accent: "var(--pink)" },
            { n: "06", title: "No judgment, real pressure", desc: "A timer keeps it honest, but there's no human on the other end watching you sweat.", accent: "var(--coral)" },
          ].map((f) => (
            <div
              key={f.n}
              className="feature-card reveal rounded-2xl p-6"
              style={{ background: "var(--panel)", border: "0.5px solid var(--border)", ["--accent" as string]: f.accent }}
            >
              <div
                className="font-mono text-sm w-10 h-10 rounded-lg flex items-center justify-center mb-4 relative z-10"
                style={{ background: "color-mix(in srgb, var(--accent) 18%, transparent)", color: f.accent }}
              >
                {f.n}
              </div>
              <div className="font-display text-lg mb-2 relative z-10">{f.title}</div>
              <div className="text-sm leading-relaxed relative z-10" style={{ color: "var(--muted)" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="max-w-4xl mx-auto px-6 my-24">
        <div className="reveal font-mono text-xs uppercase tracking-wider text-center mb-2.5" style={{ color: "var(--muted)" }}>
          How it works
        </div>
        <div className="reveal font-display text-center font-medium mb-12" style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>
          Four steps, start to finish
        </div>
        <div className="steps-row reveal grid grid-cols-1 md:grid-cols-4">
          {[
            { n: 1, title: "Pick a role", desc: "Frontend, backend, or full-stack, at the level you're targeting.", accent: "var(--coral)" },
            { n: 2, title: "Solve, live", desc: "Write code in a real editor while the AI watches your approach.", accent: "var(--periwinkle)" },
            { n: 3, title: "Get asked why", desc: "Follow-up questions based on the choices you actually made.", accent: "var(--teal)" },
            { n: 4, title: "See the report", desc: "A clear breakdown of what to work on before your next real interview.", accent: "var(--amber)" },
          ].map((s) => (
            <div key={s.n} className="text-center px-3 relative">
              <div
                className="font-mono text-sm font-medium w-10 h-10 rounded-full mx-auto mb-4 flex items-center justify-center relative z-10"
                style={{ background: "var(--ink)", border: `1.5px solid ${s.accent}`, color: s.accent }}
              >
                {s.n}
              </div>
              <div className="font-display text-base mb-1.5">{s.title}</div>
              <div className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="my-24 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <div className="reveal font-display italic mb-5 leading-snug" style={{ fontSize: "clamp(20px, 3vw, 28px)" }}>
            &quot;The first time an AI asked me why I picked a Map over an object, I realized I&apos;d never actually had to explain that out loud before.&quot;
          </div>
          <div className="reveal text-sm" style={{ color: "var(--muted)" }}>
            — a candidate who <span style={{ color: "var(--teal)" }}>got the offer</span>
          </div>
        </div>
      </section>

      <section>
        <div
          className="cta-banner reveal max-w-4xl mx-auto my-24 rounded-3xl px-10 py-14 text-center"
          style={{ border: "0.5px solid var(--border)" }}
        >
          <h3 className="font-display font-medium mb-3.5" style={{ fontSize: "clamp(24px, 4vw, 34px)" }}>
            Your next interview shouldn&apos;t be the first time you&apos;re asked this out loud.
          </h3>
          <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>
            Free to start. No scheduling, no waiting room, no judgment.
          </p>
          <Link href={user ? "/dashboard" : "/signup"} className="btn-primary text-sm font-medium px-6 py-3.5 rounded-xl inline-block">
            {user ? "Go to your dashboard" : "Start your first mock interview"}
          </Link>
        </div>
      </section>

      <footer
        className="flex flex-col md:flex-row justify-between items-center gap-2 px-12 py-7 font-mono text-[11px]"
        style={{ borderTop: "0.5px solid var(--border)", color: "var(--muted)" }}
      >
        <span>interviewroom</span>
        <span>Built with React, Node, and an AI that actually listens</span>
        <span>READY</span>
      </footer>
    </div>
  );
}