import React from "react";
import { useParams } from "react-router-dom";

const DestinationPage = () => {
  const { slug } = useParams();

  return (
    <div>
      <h1>Destination: {slug}</h1>
      <p>Detailed guide for this destination will be rendered here.</p>
    </div>
  );
};

export default DestinationPage;
