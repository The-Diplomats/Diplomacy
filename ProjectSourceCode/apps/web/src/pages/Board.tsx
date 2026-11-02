
import { useState } from "react";
import "./Board.css";

// Define what information each territory contains
interface Territory {
    name: string;
    points: string;
    labelX: number;
    labelY: number;
}

// Our first six provinces (just french territories)
// Coordinates are illustrative, not actual geography
const territories: Territory[] = [
    {
        name: "Brest",
        points: "40,100 125,75 155,145 115,200 35,175",
        labelX: 92,
        labelY: 135
    },
    {
        name: "Picardy",
        points: "125,75 225,55 255,120 155,145",
        labelX: 190,
        labelY: 100
    },
    {
        name: "Paris",
        points: "155,145 255,120 280,215 185,240 115,200",
        labelX: 190,
        labelY: 180
    },
    {
        name: "Gascony",
        points: "35,175 115,200 185,240 230,335 80,360 25,290",
        labelX: 120,
        labelY: 290
    },
    {
        name: "Burgundy",
        points: "255,120 350,135 390,240 315,290 230,335 185,240 280,215",
        labelX: 295,
        labelY: 225
    },
    {
        name: "Marseilles",
        points: "230,335 315,290 390,240 420,360 310,405 175,390",
        labelX: 310,
        labelY: 350
    }
];

export default function Board() {

    // Track the selected territory
    const [selectedTerritory, setSelectedTerritory] =
        useState<string>("None");

    return (
        <div className="board-container">

            <h1>Diplomacy</h1>

            <h3>
                Selected Territory: {selectedTerritory}
            </h3>

            <svg
                className="diplomacy-map"
                viewBox="0 0 500 450"
                xmlns="http://www.w3.org/2000/svg"
            >

                {/* Draw each territory */}
                {territories.map((territory) => (

                    <g
                        key={territory.name}
                        className={
                            selectedTerritory === territory.name
                                ? "territory selected"
                                : "territory"
                        }
                        onClick={() => {
                            setSelectedTerritory(territory.name);
                            console.log(
                                "Selected Territory:",
                                territory.name
                            );
                        }}
                    >

                        {/* Territory shape */}
                        <polygon
                            points={territory.points}
                        />

                        {/* Territory name */}
                        <text
                            x={territory.labelX}
                            y={territory.labelY}
                            textAnchor="middle"
                            className="territory-label"
                        >
                            {territory.name}
                        </text>

                    </g>

                ))}

            </svg>

        </div>
    );
}
