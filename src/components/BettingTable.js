import React, { useState, useMemo } from 'react';
import data from '../../data.json';

const BettingTables = () => {
  const matches = useMemo(() => {
    return data.data.flatMap((item) => {
      const matchData = item.matches.match;
      return Array.isArray(matchData) ? matchData : [matchData];
    }).filter((match) => match && match.id);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredMatches = useMemo(() => {
    return searchQuery
      ? matches.filter((match) =>
          match.id?.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
      : matches;
  }, [searchQuery, matches]);

  const suggestions = useMemo(() => {
    return matches
      .filter((match) =>
        match.id?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5);
  }, [searchQuery, matches]);

  const transformOdds = (typeValue, oddsTypes) => {
    const oddsType = oddsTypes.find((type) => type.value === typeValue);
    if (!oddsType || !Array.isArray(oddsType.bookmaker)) {
      return { headers: [], rows: [] };
    }

    let headers = [];
    const rows = [];

    if (typeValue.includes("Handicap")) {
      headers = ["Home", "Away"];
      const handicaps = new Set();

      oddsType.bookmaker.forEach((bm) => {
        let oddsArray = [];

        if (bm.handicap) {
          oddsArray = Array.isArray(bm.handicap)
            ? bm.handicap.flatMap((h) =>
                Array.isArray(h.odd)
                  ? h.odd.map((o) => ({
                      ...o,
                      handicap: h.name,
                      side: o.name.toLowerCase().includes("home") ? "Home" : "Away",
                      value: parseFloat(o.value) || null,
                    }))
                  : []
              )
            : Array.isArray(bm.handicap?.odd)
            ? bm.handicap.odd.map((o) => ({
                ...o,
                handicap: bm.handicap.name,
                side: o.name.toLowerCase().includes("home") ? "Home" : "Away",
                value: parseFloat(o.value) || null,
              }))
            : [];
        }

        oddsArray.forEach((odd) => {
          if (odd.handicap) handicaps.add(odd.handicap);
        });

        const sortedHandicaps = Array.from(handicaps).sort(
          (a, b) => parseFloat(a) - parseFloat(b)
        );

        sortedHandicaps.forEach((handicap) => {
          const row = [];
          const homeOdd = oddsArray.find(
            (o) => o.handicap === handicap && o.side === "Home"
          );
          const awayOdd = oddsArray.find(
            (o) => o.handicap === handicap && o.side === "Away"
          );

          row.push(homeOdd ? `${homeOdd.value} (${handicap})` : "-");
          row.push(awayOdd ? `${awayOdd.value} (${handicap})` : "-");

          if (row.some((cell) => cell !== "-")) {
            rows.push(row);
          }
        });
      });
    } else if (typeValue.includes("Over/Under")) {
      headers = ["Over", "Under"];
      const totals = new Set();

      oddsType.bookmaker.forEach((bm) => {
        let oddsArray = [];

        if (bm.total) {
          oddsArray = Array.isArray(bm.total)
            ? bm.total.flatMap((t) =>
                Array.isArray(t.odd)
                  ? t.odd.map((o) => ({
                      ...o,
                      total: t.name,
                      side: o.name.toLowerCase().includes("over") ? "Over" : "Under",
                      value: parseFloat(o.value) || null,
                    }))
                  : []
              )
            : Array.isArray(bm.total?.odd)
            ? bm.total.odd.map((o) => ({
                ...o,
                total: bm.total.name,
                side: o.name.toLowerCase().includes("over") ? "Over" : "Under",
                value: parseFloat(o.value) || null,
              }))
            : [];
        }

        oddsArray.forEach((odd) => {
          if (odd.total) totals.add(odd.total);
        });

        const sortedTotals = Array.from(totals).sort(
          (a, b) => parseFloat(a) - parseFloat(b)
        );

        sortedTotals.forEach((total) => {
          const row = [];
          const overOdd = oddsArray.find(
            (o) => o.total === total && o.side === "Over"
          );
          const underOdd = oddsArray.find(
            (o) => o.total === total && o.side === "Under"
          );

          row.push(overOdd ? `${overOdd.value} (${total})` : "-");
          row.push(underOdd ? `${underOdd.value} (${total})` : "-");

          if (row.some((cell) => cell !== "-")) {
            rows.push(row);
          }
        });
      });
    } else if (typeValue.includes("Correct Score")) {
      headers = ["Name", "US", "Value"];

      oddsType.bookmaker.forEach((bm) => {
        let oddsArray = [];

        if (bm.odd) {
          oddsArray = Array.isArray(bm.odd)
            ? bm.odd.map((o) => ({
                name: o.name,
                us: o.us,
                value: parseFloat(o.value) || null,
              }))
            : [];
        }

        oddsArray.sort((a, b) => {
          const [aHome, aAway] = a.name.split(":").map(Number);
          const [bHome, bAway] = b.name.split(":").map(Number);
          const aTotal = aHome + aAway;
          const bTotal = bHome + bAway;
          return aTotal - bTotal || aHome - bHome;
        });

        oddsArray.forEach((odd) => {
          const row = [odd.name, odd.us, odd.value || "-"];
          rows.push(row);
        });
      });
    } else {
      const uniqueOddNames = new Set();
      oddsType.bookmaker.forEach((bm) => {
        let oddsArray = Array.isArray(bm.odd)
          ? bm.odd.map((o) => ({ ...o, name: o.name }))
          : [];

        oddsArray.forEach((odd) => {
          if (odd?.name) uniqueOddNames.add(odd.name);
        });

        const row = [];
        const sortedOddNames = Array.from(uniqueOddNames).sort();
        sortedOddNames.forEach((oddName) => {
          const odd = oddsArray.find((o) => o.name === oddName);
          row.push(odd && odd.value ? parseFloat(odd.value) || "-" : "-");
        });

        if (row.some((cell) => cell !== "-")) {
          rows.push(row);
        }
      });
      headers = Array.from(uniqueOddNames).sort();
    }

    return { headers, rows };
  };

  const renderTable = (title, headers, rows) => {
    if (headers.length === 0 || rows.length === 0) {
      return null;
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
                      minWidth: '70px',
                      maxWidth: '100px',
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
                        minWidth: '70px',
                        maxWidth: '100px',
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

      {filteredMatches.length === 0 && searchQuery && (
        <p className="text-center text-gray-500">No matches found for ID "{searchQuery}"</p>
      )}
      {filteredMatches.map((match, matchIndex) => {
        const homeTeam = match.localteam?.name || 'Unknown Home Team';
        const awayTeam = match.awayteam?.name || 'Unknown Away Team';
        const matchDate = match.date || 'Unknown Date';

        if (!match.localteam?.name || !match.awayteam?.name || !match.date || !match.odds?.type) {
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
