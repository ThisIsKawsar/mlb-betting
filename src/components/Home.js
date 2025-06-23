import React from 'react';
import BettingTable from './BettingTable';

const Home = ({ data }) => {
  return (
    <div>
      <BettingTable data={data} />
    </div>
  );
};

export default Home;