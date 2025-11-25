import styled from "styled-components";
import Link from "next/link";

export const Title = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  color: #111827;
  text-align: center;
  margin-bottom: 3rem;

  @media (min-width: 768px) {
    font-size: 2.5rem;
    margin-bottom: 4rem;
  }
`;

export const OTCSection = styled.section`
  width: 100%;
  max-width: 800px;
  background-color: #f9fafb;
  padding: 2rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    padding: 3rem;
    margin-bottom: 3rem;
  }
`;

export const OTCTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  color: #111827;
  text-align: center;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    font-size: 2rem;
    margin-bottom: 2.5rem;
  }
`;

export const PriceInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-around;
    gap: 2rem;
  }
`;

export const PriceCard = styled.div`
  flex: 1;
  padding: 1.5rem;
  background-color: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  text-align: center;
  transition: all 0.2s;
  box-shadow: 0px 6px 30px rgba(0, 0, 0, 0.08);

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

export const PriceLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  font-weight: 500;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

export const PriceValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #3b82f6;

  @media (min-width: 768px) {
    font-size: 2rem;
  }
`;

export const PriceSubValue = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`;

export const LoadingText = styled.div`
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
  padding: 2rem;

  @media (min-width: 768px) {
    font-size: 1rem;
    padding: 3rem;
  }
`;

export const ErrorText = styled.div`
  text-align: center;
  color: #ef4444;
  font-size: 0.875rem;
  padding: 2rem;

  @media (min-width: 768px) {
    font-size: 1rem;
    padding: 3rem;
  }
`;

export const OTCButton = styled(Link)`
  display: block;
  width: 100%;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  background-color: #3b82f6;
  border: none;
  border-radius: 0.5rem;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #2563eb;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  @media (min-width: 768px) {
    font-size: 1.125rem;
    padding: 1.25rem 2.5rem;
  }
`;

export const Section = styled.section`
  width: 100%;
  max-width: 800px;
  background-color: #f9fafb;
  padding: 2rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    padding: 3rem;
    margin-bottom: 3rem;
  }
`;

export const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  color: #111827;
  text-align: center;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    font-size: 2rem;
    margin-bottom: 2.5rem;
  }
`;

export const SectionDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  margin-bottom: 2rem;
  line-height: 1.6;

  @media (min-width: 768px) {
    font-size: 1rem;
    margin-bottom: 2.5rem;
  }
`;

export const CardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const NewsCard = styled.div`
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    transform: translateY(-2px);
  }

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

export const NewsCardTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
  line-height: 1.4;

  @media (min-width: 768px) {
    font-size: 1.125rem;
    margin-bottom: 0.375rem;
  }
`;

export const NewsCardSummary = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

export const NewsCardDate = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: auto;
`;

export const NewsCardThumbnail = styled.div`
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #e5e7eb;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 0.875rem;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (min-width: 768px) {
    margin-bottom: 0.5rem;
  }
`;

export const NewsCardMeta = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const VideoCard = styled(NewsCard)`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 0.5rem;

  @media (min-width: 768px) {
    padding: 0.75rem;
  }
`;

export const VideoMetaRow = styled.div`
  font-size: 0.8125rem;
  color: #6b7280;
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
`;

export const VideoCardLink = styled.a`
  display: block;
  color: inherit;
  text-decoration: none;
  height: 100%;
`;

export const SectionButton = styled(Link)`
  display: inline-block;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  background-color: #3b82f6;
  border: none;
  border-radius: 0.375rem;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;

  &:hover {
    background-color: #2563eb;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  @media (min-width: 768px) {
    font-size: 1rem;
    padding: 1rem 2rem;
  }
`;

export const ActionButton = styled.button`
  display: inline-block;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  background-color: #10b981;
  border: none;
  border-radius: 0.375rem;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;

  &:hover {
    background-color: #059669;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  @media (min-width: 768px) {
    font-size: 1rem;
    padding: 1rem 2rem;
  }
`;

export const OTCHeroSection = styled.section`
  width: 100%;
  min-height: 500px;
  background: linear-gradient(90deg, #e8e2f4 0%, #434392 100%);
  padding: 6rem 1rem 3rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;

  @media (max-width: 768px) {
    padding: 5rem 1rem 2.5rem;
    background: linear-gradient(90deg, #c3bede 0%, #6261a5 100%);
  }
`;

export const OTCHeroContent = styled.div`
  width: 100%;
  max-width: 800px;
  color: #fff;
  text-align: left;
`;

export const OTCHeroTitle = styled.h2`
  font-size: 2.75rem;
  font-weight: 700;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

export const OTCHeroDescription = styled.p`
  font-size: 1rem;
  margin-bottom: 32px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 0.95rem;
  }
`;

export const OTCHeroPriceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  margin-bottom: 32px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const OTCHeroPriceCard = styled.div<{ $highlight?: boolean }>`
  background: #ffffff;
  border: ${({ $highlight }) =>
    $highlight
      ? "1px solid rgba(67, 67, 146, 0.4)"
      : "1px solid rgba(231, 231, 231, 0.6)"};
  border-radius: 16px;
  padding: 12px;
  backdrop-filter: blur(6px);
  text-align: left;
  transition: transform 0.2s ease;
  box-shadow: 0px 6px 30px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-4px);
  }

  @media (max-width: 768px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }
`;

export const OTCHeroPriceLabel = styled.div`
  font-size: 1rem; /* 16px */
  color: #6b7280;
  margin-bottom: 0.5rem;

  @media (max-width: 768px) {
    margin-bottom: 0;
  }
`;

export const OTCHeroPriceValue = styled.div`
  font-size: 1.5rem; /* 24px */
  font-weight: 700;
  color: #434392;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 1.375rem;
  }
`;

export const OTCHeroSubLabel = styled.span`
  font-size: 0.9rem;
  opacity: 0.8;
  margin-left: 0.25rem;
`;

export const OTCHeroButton = styled(Link)`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  padding: 1rem 2.5rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  background-color: #434392;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0px 6px 30px rgba(0, 0, 0, 0.08);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;
