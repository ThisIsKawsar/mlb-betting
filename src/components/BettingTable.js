import React, { useState } from 'react';
import data from '../../data.json';

const BettingTables = () => {
  // Flatten all matches from data array
  const matches = data.data.flatMap((item) => {
    const matchData = item.matches.match;
    return Array.isArray(matchData) ? matchData : [matchData];
  });

  // State for search query and suggestions
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter matches based on search query
  const filteredMatches = searchQuery
    ? matches.filter((match) =>
      match.id?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
    : matches;

  // Get suggestions for match IDs
  const suggestions = matches
    .filter((match) =>
      match.id?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 5); // Limit to 5 suggestions for performance

  const transformOdds = (typeValue, oddsTypes) => {
    const oddsType = oddsTypes.find((type) => type.value === typeValue);
    if (!oddsType || !Array.isArray(oddsType.bookmaker)) {
      return { headers: [], rows: [] };
    }

    const uniqueOddNames = new Set();
    oddsType.bookmaker.forEach((bm) => {
      if (Array.isArray(bm.odd)) {
        bm.odd.forEach((odd) => {
          if (odd?.name) uniqueOddNames.add(odd.name);
        });
      }
    });

    const sortedOddNames = Array.from(uniqueOddNames).sort();
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
      <div className="bg-white shadow-md rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="overflow-x-auto max-w-full">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className="px-4 py-2 border text-left text-sm font-medium text-gray-700"
                    style={{ minWidth: '50px', maxWidth: '70px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {header || 'N/A'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-4 py-2 border text-sm text-gray-600"
                      style={{ minWidth: '50px', maxWidth: '70px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
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
    <div className="betting-container p-6 max-w-7xl mx-auto">
      {/* Search Input */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSuggestions(e.target.value.length > 0);
          }}
          onFocus={() => setShowSuggestions(searchQuery.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Search by Match ID..."
          className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 bg-white border rounded-lg shadow-lg mt-1 w-full max-w-md">
            {suggestions.map((match, index) => (
              <div
                key={index}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setSearchQuery(match.id.toString());
                  setShowSuggestions(false);
                }}
              >
                <span className="font-medium">Match ID: {match.id}</span>
                {match.localteam?.name && match.awayteam?.name && (
                  <span className="text-sm text-gray-600">
                    {' - '}
                    {match.localteam.name} vs {match.awayteam.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Match Results */}
      {filteredMatches.length === 0 && searchQuery && (
        <p className="text-center text-gray-500">No matches found for ID "{searchQuery}"</p>
      )}
      {filteredMatches.map((match, matchIndex) => {
        if (!match.localteam?.name || !match.awayteam?.name || !match.date || !match.odds?.type) {
          return null;
        }

        const homeTeam = match.localteam.name;
        const awayTeam = match.awayteam.name;
        const matchDate = match.date;
        const oddsTypes = Array.isArray(match.odds.type) ? match.odds.type : [match.odds.type];
        const tableTypesToRender = oddsTypes
          .filter((type) => type.stop === "False")
          .map((type) => type.value);

        return (
          <div key={matchIndex} className="match-container mb-8">
            <div className="match-header flex justify-between items-center bg-gray-100 p-4 rounded-lg">
              <div className="match-teams">
                <h2 className="text-xl font-bold">{`${homeTeam} (0/0)`}</h2>
              </div>
              <div className="match-time text-center">
                <div className="time-date">
                  <span className="date text-sm text-gray-600">{matchDate}</span>
                </div>
                <span className="text-sm text-gray-500">Match ID: {match.id}</span>
              </div>
              <div className="match-teams">
                <h2 className="text-xl font-bold">{awayTeam}</h2>
              </div>
            </div>

            <div className="betting-section mt-4">
              <div className="left-column">
                {tableTypesToRender.map((type) => {
                  const { headers, rows } = transformOdds(type, oddsTypes);
                  return renderTable(type, headers, rows);
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BettingTables;