import React, { useState, useEffect } from 'react';

const BettingTable = ({ data = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [filteredData, setFilteredData] = useState(data);

  useEffect(() => {
    if (searchTerm) {
      const filtered = data.filter(
        (match) =>
          match?.matches?.match?.id &&
          match.matches.match.id.toString().includes(searchTerm)
      );
      setFilteredData(filtered);
      setSuggestions(
        data
          .filter(
            (match) =>
              match?.matches?.match?.id &&
              match.matches.match.id.toString().includes(searchTerm) &&
              match.matches.match.id.toString() !== searchTerm
          )
          .map((match) => match.matches.match.id.toString())
      );
    } else {
      setFilteredData(data);
      setSuggestions([]);
    }
  }, [searchTerm, data]);

  const getTableData = (match) => {
    if (!match?.matches?.match?.odds) {
      console.log('No odds data available for match:', match);
      return [];
    }

    const odds = match.matches.match.odds;
    if (Array.isArray(odds)) {
      return odds.flatMap((odd) =>
        odd?.type
          ? odd.type.map((type) => ({
              value: type.value || 'Unknown',
              bookmaker: Array.isArray(type.bookmaker) ? type.bookmaker : [],
            }))
          : []
      );
    } else if (odds?.type) {
      return Array.isArray(odds.type)
        ? odds.type.map((type) => ({
            value: type.value || 'Unknown',
            bookmaker: Array.isArray(type.bookmaker) ? type.bookmaker : [],
          }))
        : [];
    }
    console.log('Invalid odds structure:', odds);
    return [];
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="betting-table-container">
      <div className="search-container">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search by match id..."
          className="search-input"
        />
        {suggestions.length > 0 && (
          <ul className="suggestions">
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion}
                onClick={() => setSearchTerm(suggestion)}
                className="suggestion-item"
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>

      {filteredData.length === 0 && <div>No matches found</div>}

      {filteredData.map((item, index) => {
        const match = item?.matches?.match;
        if (!match || !match.localteam?.name || !match.awayteam?.name || !match.id) {
          console.log('Invalid match data:', item);
          return <div key={index}>Invalid match data</div>;
        }

        const tableData = getTableData(item);

        return (
          <div key={match.id} className="match-table">
            <h2>
              {match.localteam.name} vs {match.awayteam.name} (ID: {match.id})
            </h2>
            {tableData.length > 0 ? (
              tableData.map((data, i) => {
                if (!data.bookmaker || !Array.isArray(data.bookmaker)) {
                  console.log('Invalid bookmaker data:', data.bookmaker);
                  return <div key={i}>No bookmaker data available</div>;
                }

                return (
                  <table key={`${match.id}-${data.value}-${i}`} className="betting-table">
                    <thead>
                      <tr>
                        <th colSpan={data.bookmaker.length + 1}>{data.value}</th>
                      </tr>
                      <tr>
                        <th>Odd Name</th>
                        {data.bookmaker.map((book, j) => (
                          <th key={`${book.id}-${j}`}>{book.name || 'Unknown Bookmaker'}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.bookmaker[0]?.odd && Array.isArray(data.bookmaker[0].odd) ? (
                        data.bookmaker[0].odd.map((odd, j) => (
                          <tr key={`${odd.name}-${j}`}>
                            <td>{odd.name || 'Unknown Odd'}</td>
                            {data.bookmaker.map((book, k) => (
                              <td key={`${book.id}-${odd.name}-${k}`}>
                                {book.odd?.find((o) => o.name === odd.name)?.us || '-'}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={data.bookmaker.length + 1}>No odds data available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                );
              })
            ) : (
              <div>No table data available</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BettingTable;