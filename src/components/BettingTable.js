import React from 'react';
import data from '../../data.json';

const BettingTables = () => {
  const match = data.data[0].matches.match;
  console.log(match);

  const homeTeam = match.localteam.name;
  const awayTeam = match.awayteam.name;
  const matchDate = match.date;
  const oddsTypes = match.odds.type;
  const tableTypesToRender = oddsTypes
    .filter((type) => type.stop === "False") // only active types
    .map((type) => type.value);

  const transformOdds = (typeValue) => {
    const oddsType = oddsTypes.find((type) => type.value === typeValue);
    if (!oddsType || !Array.isArray(oddsType.bookmaker)) {
      return { headers: [], rows: [] };
    }

    // Extract all unique odd names for this type (e.g., "1:0", "2:0", etc.)
    const uniqueOddNames = new Set();
    oddsType.bookmaker.forEach((bm) => {
      if (Array.isArray(bm.odd)) {
        bm.odd.forEach((odd) => {
          if (odd?.name) uniqueOddNames.add(odd.name);
        });
      }
    });

    const sortedOddNames = Array.from(uniqueOddNames).sort(); // Sort for better readability
    const headers = [...sortedOddNames];
    const rows = oddsType.bookmaker.map((bm) => {
      const row = [];
      sortedOddNames.forEach((oddName) => {
        const odd = Array.isArray(bm.odd) ? bm.odd.find((o) => o.name === oddName) : null;
        row.push(odd ? parseFloat(odd.value) || '-' : '-');
      });
      return row;
    });



    return { headers, rows };
  };

  const renderTable = (title, headers, rows) => {


    return (
      <div className="betting-card">
        <h3>{title}</h3>
        <div className="table-wrapper" style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <table>
            <thead>
              <tr>
                {headers.map((header, index) => (
                  <th key={index} style={{ minWidth: '50px', maxWidth: '70px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {header || 'N/A'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} style={{ minWidth: '50px', maxWidth: '70px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cell !== null && cell !== undefined ? cell : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="betting-container">
      <div className="match-header">
        <div className="match-teams">
          <h2>{`${homeTeam} (0/0)`}</h2>
        </div>
        <div className="match-time">
          <div className="time-date">
            <span className="date">{matchDate}</span>
          </div>
        </div>
        <div className="match-teams">
          <h2>{awayTeam}</h2>
        </div>
      </div>

      <div className="betting-section">
        <div className="left-column">
          {tableTypesToRender.map((type) => {
            const { headers, rows } = transformOdds(type);
            return renderTable(type, headers, rows);
          })}
        </div>
      </div>
    </div>
  );
};

export default BettingTables;