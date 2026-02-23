"use client";

import ApiError from "@/components/pages/Error/ApiError";
import HomeSkeleton from "@/components/pages/ui/HomeSkeleton";
import useApi from "@/components/principal/UseApi";
import HomeContent from "@/Home/HomeContent";


export default function Home() {
  const { loading, error, refetch } = useApi();
  return (
    <>

      {loading && <HomeSkeleton />}
      {!loading && error && <ApiError onRetry={refetch} />}
      {!loading && !error && <HomeContent />}
    </>
  );
}
