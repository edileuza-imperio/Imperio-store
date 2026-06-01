"use client";

type Props = {
  className?: string;
};

export default function SkeletonDestaques({ className = "" }: Props) {
  return (
    <section className={`section ${className}`}>
      <div className="container">
        <div className="header">
          <div className="headerText">
            <div className="skeleton skeletonBadge" />
            <div className="skeleton skeletonTitle" />
            <div className="skeleton skeletonText" />
          </div>

          <div className="skeleton skeletonButton" />
        </div>

        <div className="skeletonGrid">
          {Array.from({ length: 4 }).map((_, index) => (
            <article className="skeletonCard" key={index}>
              <div className="skeleton skeletonImage" />

              <div className="skeletonBody">
                <div className="skeleton skeletonLineTitle" />
                <div className="skeleton skeletonLine" />
                <div className="skeleton skeletonLineShort" />

                <div className="skeletonActions">
                  <div className="skeleton skeletonBtn" />
                  <div className="skeleton skeletonBtn outline" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <style jsx>{`
        .section {
          padding: 28px 0;
        }

        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 16px;
        }

        .header {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 20px;
        }

        .headerText {
          flex: 1;
        }

        .skeleton {
          position: relative;
          overflow: hidden;
          background: #eadfd8;
          border-radius: 16px;
        }

        .skeleton::before {
          content: "";
          position: absolute;
          top: 0;
          left: -160px;
          width: 120px;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.7),
            transparent
          );
          animation: shimmer 1.15s infinite;
        }

        .skeletonBadge {
          width: 86px;
          height: 26px;
          margin-bottom: 12px;
          border-radius: 999px;
        }

        .skeletonTitle {
          width: 60%;
          height: 38px;
          margin-bottom: 10px;
        }

        .skeletonText {
          width: 85%;
          height: 18px;
        }

        .skeletonButton {
          width: 124px;
          height: 44px;
          border-radius: 14px;
        }

        .skeletonGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }

        .skeletonCard {
          border-radius: 24px;
          overflow: hidden;
          background: #fff;
        }

        .skeletonImage {
          width: 100%;
          aspect-ratio: 1;
        }

        .skeletonBody {
          padding: 16px;
        }

        .skeletonLineTitle {
          height: 22px;
          width: 80%;
          margin-bottom: 10px;
        }

        .skeletonLine {
          height: 16px;
          margin-bottom: 10px;
        }

        .skeletonLineShort {
          width: 60%;
          height: 16px;
          margin-bottom: 18px;
        }

        .skeletonActions {
          display: flex;
          gap: 10px;
        }

        .skeletonBtn {
          flex: 1;
          height: 42px;
          border-radius: 14px;
        }

        .outline {
          background: #f2e7e1;
        }

        @keyframes shimmer {
          100% {
            left: 120%;
          }
        }

        @media (max-width: 768px) {
          .skeletonGrid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .skeletonGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}