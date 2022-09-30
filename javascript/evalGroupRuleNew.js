(async function() {

    const headers = {
        'accept': 'application/json',
        'content-type' : 'application/json',
        'X-Okta-XsrfToken': document.querySelector('#_xsrfToken').innerText
    }
    
    const groupId = getGroupId();
    const groupRuleId = getGroupRuleId();

    if (groupRuleId != false) {

        const groupMembers = await getGroupMembers(groupId);
        const rule = await getGroupRule(groupRuleId);

        const tableResult = [];

        for (const user of groupMembers) {

            const eval = await evalGroupRule(rule,user,tableResult);
            
            data={
                'userId' : user.id,
                'ruleValue' : rule.conditions.expression.value,
                'username' : user.profile.login,
                'evalResult' : eval
            }
            tableResult.push(data)
            
        }

        console.table(tableResult);
    }

    // from Rockstar https://github.com/gabrielsroka/gabrielsroka.github.io/blob/master/rockstar/rockstar.js#L774
    function getGroupId() {
        var path = location.pathname;
        var pathparts = path.split('/');
        if (path.match("admin/group") && (pathparts.length == 4)) {
            return pathparts[3];
        }
    }

    function getGroupRuleId() {
        
        const groupRuleId = prompt('Please enter the group rule id');
        if (groupRuleId) {
            return groupRuleId;
        }
        else {
            alert("No value provided");
            return false;
        }
    }

    async function getGroupRule(groupRuleId) {

        const url = '/api/v1/groups/rules/' + groupRuleId;
        const r = await fetch(url, {headers});
        const rule = await r.json();
        return rule;

    }

    async function getGroupMembers(groupId) {

        const url = '/api/v1/groups/' + groupId + '/users';
        const r = await fetch(url, {headers});
        const groupMembers = await r.json();
        return groupMembers;

    }

    async function evalGroupRule(rule,user,tableResult) {
        
        const ruleValue = rule.conditions.expression.value;
        const url = '/api/v1/internal/expression/eval';        
        const body = JSON.stringify([{
            "type":"urn:okta:expression:1.0",
            "value": ruleValue,
            "targets":{"user":user.id},
            "operation":"CONDITION"
        }]);
        console.log(body);
        const r = await fetch(url, {method: 'post', body, headers});
        const eval = await r.json();
        const result = eval[0].result;
        console.log(result);
        console.log(r.headers.get('x-rate-limit-limit'));
        console.log(r.headers.get('x-rate-limit-remaining'));
        console.log(r.headers.get('x-rate-limit-reset'));

        
        return result;
    }

}
)();