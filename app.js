
function getJson() {

    Promise.all([
	fetch('https://api.spacexdata.com/v4/launches'),
	fetch('https://api.spacexdata.com/v4/rockets'),
    fetch('https://api.spacexdata.com/v4/payloads')])
        .then(function (responses) {
        // Get a JSON object from each of the responses
        return Promise.all(responses.map(function (response) {
            return response.json();
        }));
        }).then(function (data) {
            const launchData = data[0];
            const rocketData = data[1];
            const payloadData = data[2];

            // define function to change PST to CST
            function convertTZ(date, tzString) {
                return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", { timeZone: tzString }));
            }

            //trailing zeros function
            function leading_zeros(dt) { 
                if (dt < 10) {
                    return ('0' + dt)
                } else {
                    return dt
                }
            }

            // Loop through json object to extract necessary values
            var result = []
            for (var i = 0; i < launchData.length; i++) {
                var data = {
                    date_pst: new Date(launchData[i].date_utc),
                    success: launchData[i].success,
                    flight_number: launchData[i].flight_number,
                    launch_name: launchData[i].name,
                    date_cst: 
                            (
                            convertTZ((launchData[i].date_utc), "America/Chicago").getMonth() + 1 + "/" +
                            convertTZ((launchData[i].date_utc), "America/Chicago").getDate() + "/" +
                            convertTZ((launchData[i].date_utc), "America/Chicago").getFullYear() 
                            ),
                    time_cst: 
                            (
                            leading_zeros(convertTZ((launchData[i].date_utc), "America/Chicago").getHours()) + ":" +
                            leading_zeros(convertTZ((launchData[i].date_utc), "America/Chicago").getMinutes())
                            )
                }

                for (var j = 0; j < payloadData.length; j++) {
                    if (payloadData[j].launch == launchData[i].id) data.mass_kg = payloadData[j].mass_kg
                }
                for (var k = 0; k < rocketData.length; k++) {
                    if (rocketData[k].id == launchData[i].rocket) data.rocket_name = rocketData[k].name
                }
                result.push(data)
            }
        
            // Updates success columns 
            for (var z = 0; z < result.length; z++) {
                // define today
                today = new Date();
                // postponed
                if (result[z].success === null && result[z].date_pst < today) result[z].success = "Postponed";
                // days to launch
                if (result[z].success === null) result[z].success = ("T-minus " + ( ((result[z].date_pst).getTime() - today.getTime()) / (1000 * 3600 * 24)).toFixed() + " days");
                // update bool values
                if (result[z].success === true) result[z].success = 'Yes';
                if (result[z].success === false) result[z].success = 'No';
                }

            // update countdown clock
                function countDown() {
                    const second = 1000,
                        minute = second * 60,
                        hour = minute * 60,
                        day = hour * 24;

                    // get next launch date for countdown timer
                    let closest = Infinity;
                    let closest_launch;
                    result.forEach(function(d) {

                        let today = new Date();
                        let launch = new Date(d.date_pst);


                        if (launch > today && (launch < closest)) {
                            closest = launch;
                            closest_launch = d.launch_name;
                        }
                    });

                        let nextLaunch = closest,
                        countDown = new Date(nextLaunch).getTime()

                        document.getElementById("next-launch").innerText = `Next Launch: ${closest_launch}`;

                        x = setInterval(function () {

                            let now = new Date().getTime(),
                            distance = countDown - now;
                    
                            (document.getElementById("day").innerText = Math.floor(distance / day)),
                            (document.getElementById("hour").innerText = Math.floor((distance % day) / hour)),
                            (document.getElementById("minute").innerText = Math.floor((distance % hour) / minute)),
                            (document.getElementById("second").innerText = Math.floor((distance % minute) / second));
                            
                        
                        });
            };
            
            countDown();
            
            // sort by payload mass for ranking add
            result.sort(function (a, b) {
                return b.mass_kg - a.mass_kg
            })

            // add ranking
            var rank = 0
            for (var d = 0; d < result.length; d++) {
                if (d==0)
                    result[d] = rank
                else {
                    if (result[d].mass_kg != result[d-1].mass_kg)
                        rank++
                }
                result[d].rank = rank
            }

            // sort by launch date for final viewing
            result.sort(function (a, b) {
                return b.date_pst - a.date_pst
            })

            // Remove undefined
            result.splice(0,1);

            // Display table
            let output = '';
            result.forEach(function(line) {
                output += `<tr>
                    <th class="text-center ">${line.date_cst}</th>
                    <th class="text-center ">${line.time_cst}</th>
                    <th class="text-center">${line.flight_number}</th>
                    <th class="text-center">${line.launch_name}</th>
                    <th class="text-center">${line.success}</th>
                    <th class="text-center">${line.rocket_name}</th>
                    <th class="text-center">${line.rank}</th>
                    <tr>`;
            })

            document.getElementById('output').innerHTML = output;

            }).catch(function (error) {
                // if there's an error, log it
                console.log(error);
            });
}

getJson();