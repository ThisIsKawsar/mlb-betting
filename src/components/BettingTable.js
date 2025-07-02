
import React, { useState, useMemo } from 'react';
import data from '../../data.json';

const BettingTables = () => {

  const matches = useMemo(() => {
    return data.data.flatMap((item) => {
      const matchData = item.matches.match;
      return Array.isArray(matchData) ? matchData : [matchData];
    }).filter((match) => match && match.id);
  }, []);

  // State for search query and suggestions
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter matches based on search query
  const filteredMatches = useMemo(() => {
    return searchQuery
      ? matches.filter((match) =>
        match.id?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
      : matches;
  }, [searchQuery, matches]);

  // Get suggestions for match IDs
  const suggestions = useMemo(() => {
    return matches
      .filter((match) =>
        match.id?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5); // Limit to 5 suggestions
  }, [searchQuery, matches]);

  const transformOdds = (typeValue, oddsTypes) => {
    const oddsType = oddsTypes.find((type) => type.value === typeValue);
    if (!oddsType || !Array.isArray(oddsType.bookmaker)) {
      // console.warn(`No valid bookmaker data for betting type: ${typeValue}`);
      return { headers: [], rows: [] };
    }

    const uniqueOddNames = new Set();
    const rows = [];

    oddsType.bookmaker.forEach((bm) => {
      let oddsArray = [];

      // Handle different data structures based on betting type
      if (typeValue.includes("Handicap") && bm.handicap) {
        // Handle Asian Handicap (handicap can be array or object)
        oddsArray = Array.isArray(bm.handicap)
          ? bm.handicap.flatMap((h) =>
            Array.isArray(h.odd)
              ? h.odd.map((o) => ({
                ...o,
                name: `${o.name} (${h.name})`,
              }))
              : []
          )
          : Array.isArray(bm.handicap?.odd)
            ? bm.handicap.odd.map((o) => ({
              ...o,
              name: `${o.name} (${bm.handicap.name})`,
            }))
            : [];
      } else if (typeValue.includes("Over/Under") && bm.total) {
        // Handle Over/Under (total can be array or object)
        oddsArray = Array.isArray(bm.total)
          ? bm.total.flatMap((t) =>
            Array.isArray(t.odd)
              ? t.odd.map((o) => ({
                ...o,
                name: `${o.name} (${t.name})`,
              }))
              : []
          )
          : Array.isArray(bm.total?.odd)
            ? bm.total.odd.map((o) => ({
              ...o,
              name: `${o.name} (${bm.total.name})`,
            }))
            : [];
      } else if (Array.isArray(bm.odd)) {
        // Handle direct odds (e.g., 3Way Result, Home/Away, Odd/Even, Correct Score)
        oddsArray = bm.odd.map((o) => ({ ...o, name: o.name }));
      } else {
        // Fallback for unexpected structures
        // console.warn(
        //   `Unexpected odds structure for bookmaker: ${bm.name || 'Unknown'} in type: ${typeValue}`,
        //   bm
        // );
        oddsArray = [];
      }

      // Collect unique odd names
      oddsArray.forEach((odd) => {
        if (odd?.name) uniqueOddNames.add(odd.name);
      });

      // Build row for this bookmaker
      const row = [];
      const sortedOddNames = Array.from(uniqueOddNames).sort();
      sortedOddNames.forEach((oddName) => {
        const odd = oddsArray.find((o) => o.name === oddName);
        row.push(odd && odd.value ? parseFloat(odd.value) || '-' : '-');
      });

      // Only include rows with at least one valid odd
      if (row.some((cell) => cell !== '-')) {
        rows.push(row);
      }
    });

    const headers = Array.from(uniqueOddNames).sort();
    if (headers.length > 0 && rows.length === 0) {
      // console.warn(`No valid odds data for betting type: ${typeValue}, headers:`, headers);
    }
    return { headers, rows };
  };

  const renderTable = (title, headers, rows) => {
    if (headers.length === 0 || rows.length === 0) {
      return null; // Don't render empty tables
    }

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
                    style={{
                      minWidth: '50px',
                      maxWidth: '70px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
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
                      style={{
                        minWidth: '50px',
                        maxWidth: '70px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
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

  // Precompute odds for all matches to ensure consistent hook usage
  const matchOdds = useMemo(() => {
    return matches.map((match) => {
      const oddsTypes = Array.isArray(match.odds?.type)
        ? match.odds.type
        : match.odds?.type
          ? [match.odds.type]
          : [];
      return {
        match,
        precomputedOdds: oddsTypes.map((type) => ({
          type: type.value,
          ...transformOdds(type.value, oddsTypes),
        })),
      };
    });
  }, [matches]);

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
        const homeTeam = match.localteam?.name || 'Unknown Home Team';
        const awayTeam = match.awayteam?.name || 'Unknown Away Team';
        const matchDate = match.date || 'Unknown Date';

        // Skip invalid matches after computing hooks
        if (!match.localteam?.name || !match.awayteam?.name || !match.date || !match.odds?.type) {
          // console.warn(`Skipping match ${match.id} due to missing data`);
          return null;
        }

        const { precomputedOdds } = matchOdds.find((mo) => mo.match.id === match.id) || {
          precomputedOdds: [],
        };

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
                {precomputedOdds.map(({ type, headers, rows }, index) => (
                  <React.Fragment key={index}>
                    {renderTable(type, headers, rows)}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BettingTables;
