import { useState, useEffect } from "react";
import { catchErrors } from "../utils";
import { getTopTracks } from "../spotify";
import { TrackList, SectionWrapper, TimeRangeButtons } from "../components";

const TopTracks = () => {
  const [topTracks, setTopTracks] = useState(null);
  const [activeRange, setActiveRange] = useState("short");

  useEffect(() => {
    const fetchData = async () => {
      const userTopTracks = await getTopTracks(`${activeRange}_term`);
      setTopTracks(userTopTracks.data);
    };

    catchErrors(fetchData());
  }, [activeRange]);

  console.log(topTracks);

  return (
    <main>
      {topTracks && (
        <SectionWrapper title="top Tracks" breadcrumb="true">
          <TimeRangeButtons activeRange={activeRange} setActiveRange={setActiveRange} />
          <TrackList tracks={topTracks.items} />
        </SectionWrapper>
      )}
    </main>
  );
};

export default TopTracks;
