/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('control.Construction');
 * mod.thing == 'a thing'; // true
 */

function Construction(room)
{
    this.room = room;
    this.roomInfo = room.memory.roomInfo;
    this.activeConstructionSites = this.room.find(FIND_MY_CONSTRUCTION_SITES);
    this.builders = this.room.find(FIND_MY_CREEPS, { filter: object => object.memory.role == 'builder' });


    // Set the Memory Objects
    if (!this.room.memory.roomInfo.futureConstructionSites) { this.room.memory.roomInfo.futureConstructionSites = new Array; }
    if (!this.room.memory.roomInfo.knownRoads) { this.room.memory.roomInfo.knownRoads = new Array; }

}

Construction.prototype.run = function()
{
    // Plan next constructions. (This fills up the futureconstructionsites array)
    this.PlanNextConstruction();

    // Do construction stuff - but only if we have builders and are not already building
    if ( this.builders.length > 0  && this.activeConstructionSites.length == 0 )
    {
        if (this.room.memory.roomInfo.futureConstructionSites.length > 0 )
        {
            this.BuildNextConstructionSite();
        }
    }
};

Construction.prototype.PlanNextConstruction = function ()
{
    // Build stuff based on room controller's upgrade level.
    // Check for higher level stuff first, leave the low level stuff for when we have time later on.

    // console.log('control.Construction.PlanNextConstruction: Planning next construction project.');


    var spawns  = this.roomInfo.spawns;
    var sources = this.roomInfo.sources;
    var controller = this.room.controller;
    var controllerLevel = this.room.controller.level;

    var spawn = Game.getObjectById(spawns[0].id);

    // Level 2 or higher
    //      - Up to 5 Extensions (Near a road if possible)
    //      - a road around the spawn
    //      - Ramparts around spawn
    //      - Up to 5 containers (useful ?)
    if (controllerLevel >= 2 )
    {

        //Mental Note:  Find a clean way to delay construction on extensions untill we have a fair number of roads out.
        //              we're a bit too efficient at the start right now, and extensions are getting built where we don't really want them.
        //              Either that, or rethink how/where we plan on building them.

        var currentExtensions = this.room.find(FIND_MY_STRUCTURES, {filter: { structureType: STRUCTURE_EXTENSION }}).length;
        var futureExtensions = _.filter(this.roomInfo.futureConstructionSites, function(item){return item.structure == STRUCTURE_EXTENSION}).length;
        var maxExtensions = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][controllerLevel];

        // console.log('DEBUG: control.Construction - Extensions: (Current: ' + currentExtensions + ') (Planned: ' + futureExtensions + ') (Max: ' + maxExtensions + ')');

        if (currentExtensions + futureExtensions < maxExtensions)
        {
            var roads = this.room.find(FIND_STRUCTURES, {filter: { structureType: STRUCTURE_ROAD } });
            // console.log('DEBUG: control.Construction - roads:' + roads);
            if (roads && roads.length > 20) //Silly check, make sure at least xx roads are built before adding extensions
            {
                //Get a random piece of road, we'll try to build there
                var whereToBuild = roads[Math.floor(Math.random() * roads.length)];
                // console.log('DEBUG: control.Construction - whereToBuild:' + whereToBuild);
                if (PlanBuilding(whereToBuild,STRUCTURE_EXTENSION))
                {
                    console.log('control.Construction - Planning an [extension] somewhere near ' + whereToBuild.pos);
                }
            }
        }
    }


    // Level 1 or higher
    //      - Roads to Nearest source
    //      - Roads to controller
    //		- Roads to the other sources (if there are any)
    if ( controllerLevel >= 1 )
    {

        // PlanRoad returns false if the road has already been built (is in the "known roads" list)
        // the if(!) construct should therefor only execute the next line if the previous has already been done
        // makes for quick and easy lines of:  if (!planroad(a,b)) if (!planroad(b,c))

        // First things first, Plan a road around the spawn
        // This will be a high traffic area.
        // Also, this will prevent the building of other structures right next to the spawn.
        if (!PlanRoad(spawn, spawn))

        // for every source, plan the following roads:
        //      1) road to/from the spawn
        //      2) road to/from the controller
        //      3)road around the source location (do we need this?)

        for (let n in sources)
        {
       
            var source = Game.getObjectById(sources[n].id)
            if (!PlanRoad(spawn, source))
                if (!PlanRoad(source, spawn))
                    if (!PlanRoad(source, controller))
                    {} // Empty code block or it will not compile
        }


        // Pave the areas around the spawn and controller
		if (!PlanRoad(spawn, controller))
		    if (!PlanRoad(controller, controller))
            { } // Empty code block or it will not compile

    }

};
Construction.prototype.BuildNextConstructionSite = function ()
{
    if (this.room.memory.roomInfo.futureConstructionSites.length > 0)
    {
        var nextConstructionSite = this.room.memory.roomInfo.futureConstructionSites.shift();
        var pos = new RoomPosition(nextConstructionSite.position.x, nextConstructionSite.position.y, nextConstructionSite.position.roomName);
        console.log('control.Construction: Starting work on structure [' + nextConstructionSite.structure + '] at position ' + pos)
        this.room.createConstructionSite(pos, nextConstructionSite.structure);
    }
};

Construction.prototype.Report = function()
{
    // Build a population Report
    var report = new Array;
    var targets = this.room.find(FIND_STRUCTURES, { filter: (s) => s.hits < ( s.hitsMax * 0.9 ) });
    var urgent_targets = this.room.find(FIND_STRUCTURES, { filter: (s) => s.hits <  s.hitsMax * 0.05});

    //Header
    report.push('---------- Construction Report ----------');
    report.push('-');

    report.push('- Number of planned construction sites: ' + this.room.memory.roomInfo.futureConstructionSites.length);
    report.push('- Number of known roads: ' + this.room.memory.roomInfo.knownRoads.length);
    report.push('- Number of repairs: ' + targets.length);
    report.push('- Number of urgent repairs: ' + urgent_targets.length);


    return report;
};

module.exports = Construction ;

// Private stuff goes here

function PlanRoad  (start, end)
{
    //Check if road is already known
    var roadIsKnown = false;
    var knownRoads =  start.room.memory.roomInfo.knownRoads;

    if ( knownRoads && knownRoads.length > 0)
    {
        for ( let n in knownRoads )
        {
            var knownRoad = knownRoads[n];
            if ( knownRoad.start.x == start.pos.x &&  knownRoad.start.y == start.pos.y &&  knownRoad.end.x == end.pos.x &&  knownRoad.end.y == end.pos.y  )
            {
                roadIsKnown = true;
            }
        }
    }
    // If not a known road, plan it.
    if ( !roadIsKnown )
    {
        var road = {};

        // Special case, if start and end are the same, build a road around the object
        // otherwise plan one from start to end
        if (start == end )
        {
            console.log('control.Construction.PlanRoad: Around Position: ' + start.pos );

            road = getSurroundingPositions(start) ;

        }
        else
        {
            console.log('control.Construction.PlanRoad: start: ' + start + ' - position: ' + start.pos );
            console.log('control.Construction.PlanRoad: end: ' + end + ' - position: ' + end.pos );

            road = PathFinder.search(start.pos, { pos: end.pos, range: 1 }) ;
        }
        for ( let n in road.path )
        {
            var buildPosition = road.path[n];
            start.room.memory.roomInfo.futureConstructionSites.push({position: buildPosition, structure: STRUCTURE_ROAD})
        }

        start.room.memory.roomInfo.knownRoads.push({start: start.pos, end: end.pos });
    }

    // Set a return value, so the caller knows if we did anything
    return (!roadIsKnown);
}

function PlanBuilding (roomObject, StructureType)
{
    // Try to build a structure near to the roomObject

    var candidates = getSurroundingPositions(roomObject);
    var found = false;
    var attempts = 0;
    var buildPosition = {};

    // console.log('DEBUG: control.Construction.PlanBuilding - roomObject:' + roomObject);
    // console.log('DEBUG: control.Construction.PlanBuilding - StructureType:' + StructureType);

    while (!found && attempts < 10)
    {
        attempts++; // Just in case we end up looping infinitely.

        // Pick a random position from the candidates
        buildPosition = candidates.path[Math.floor(Math.random()*candidates.path.length)];
        // console.log('DEBUG: control.Construction.PlanBuilding - buildPosition:' + buildPosition + ' (attempt: ' + attempts + ')');
        // console.log('DEBUG: control.Construction.PlanBuilding - buildPosition: HAS TERRAIN?' + JSON.stringify(buildPosition.lookFor(LOOK_TERRAIN)));
        // console.log('DEBUG: control.Construction.PlanBuilding - buildPosition: HAS SITES?' + JSON.stringify(buildPosition.lookFor(LOOK_CONSTRUCTION_SITES)));
        // console.log('DEBUG: control.Construction.PlanBuilding - buildPosition: HAS STRUCTURES?' + JSON.stringify(buildPosition.lookFor(LOOK_STRUCTURES)));
        // Check if it is buildable (I really hope this works )
        if (    buildPosition.lookFor(LOOK_TERRAIN) == 'plain'
            &&  buildPosition.lookFor(LOOK_CONSTRUCTION_SITES).length == 0
            &&  buildPosition.lookFor(LOOK_STRUCTURES).length == 0)
        {
            found = true;
            // Add the structure & location to the top of the construction list.
            roomObject.room.memory.roomInfo.futureConstructionSites.unshift({position: buildPosition, structure: StructureType})
        }
    }

    // Return success status to caller
    return found;
}


/**
 * getSurroundingPositions
 *      Returns all the positions around an ingame object.
 *
 * @param {RoomObject} roomObject The object around which to look.
 * @returns {object} object.path contains an array of RoomPosition objects
 * @example
 */
function getSurroundingPositions (roomObject)
{
    var pos = roomObject.pos;
    var RetVal = new Array;


    RetVal.push(new RoomPosition(pos.x + 1 , pos.y + 1 , pos.roomName));
    RetVal.push(new RoomPosition(pos.x + 1 , pos.y     , pos.roomName));
    RetVal.push(new RoomPosition(pos.x + 1 , pos.y - 1 , pos.roomName));
    RetVal.push(new RoomPosition(pos.x     , pos.y + 1 , pos.roomName));
    RetVal.push(new RoomPosition(pos.x     , pos.y - 1 , pos.roomName));
    RetVal.push(new RoomPosition(pos.x - 1 , pos.y + 1 , pos.roomName));
    RetVal.push(new RoomPosition(pos.x - 1 , pos.y     , pos.roomName));
    RetVal.push(new RoomPosition(pos.x - 1 , pos.y - 1 , pos.roomName));

    return {path: RetVal} ;


}
