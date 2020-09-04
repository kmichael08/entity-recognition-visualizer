const https = require('https')

function parse_ta_output(output) {
    output = JSON.parse(output)
    output = output['documents'][0]['entities']
    function parse_umls(links) {
        if (links !== undefined) {
            let umls = links.filter(l => l['dataSource'] === "UMLS")
            if (umls.length === 1) {
                return umls[0]['id']
            }
        }
    }
    return output.map(entry => {
        return {
            start: entry['offset'],
            end: entry['offset'] + output['length'],
            category: entry['category'],
            umls: parse_umls(entry['links'])
        }
    })
}

async function call_text_analytics(text) {
    let body = JSON.stringify({
        documents: [
            {
                language: 'en',
                id: '1',
                text: text
            }
        ]
    });
    const options = {
        hostname: `ta4h-app-service.azurewebsites.net`,
        path: '/text/analytics/v3.2-preview.1/entities/health/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    }
    let data = ''
    return new Promise((resolve, _) => {
        const req = https.request(options, res => {
            console.log(`statusCode: ${res.statusCode}`)
            console.log(res.statusMessage)
            res.on('data', d => {
                data = data + d.toString()
            })
            res.on('end', () => {
                    resolve(data)
                }
            )
        })
        req.on('error', error => {
            console.error(error)
        })
        req.write(body)
        req.end()
    })

}
let text = `All female participants that are premenopausal will be required to have a pregnancy tet ; any participant
            who is pregnant or breastfeeding will not be included`

call_text_analytics(text).then(
    value => {
        let output = parse_ta_output(value)
        console.log(output)
    }
)