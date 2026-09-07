const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/contexts/PersonalizationContext.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('apiGovernance')) {
  content = content.replace("import { supabase } from '../lib/supabase';", "import { supabase } from '../lib/supabase';\nimport { apiGovernance } from '../lib/api-governance';");
}

const oldFetch = `        const { data, error } = await supabase
          .from('user_personalization')
          .select('*')
          .limit(1)
          .maybeSingle();`;
const newFetch = `        const data = await apiGovernance.fetchWithGovernance<any>(
          'app_user_personalization',
          async () => {
            const { data: resData, error } = await supabase
              .from('user_personalization')
              .select('*')
              .limit(1)
              .maybeSingle();
            if (error) throw error;
            return resData;
          },
          { ttl: 300000 }
        );
        const error = null; // for backward compatibility in the following if-check`;

content = content.replace(oldFetch, newFetch);

const oldUpsert = `await supabase.from('user_personalization').upsert(`;
const newUpsert = `await supabase.from('user_personalization').upsert(`;

if (!content.includes("apiGovernance.invalidate('app_user_personalization');")) {
    const upsertBlockEnd = `            { onConflict: 'id' }\n          );`;
    const newUpsertBlockEnd = `            { onConflict: 'id' }\n          );\n          apiGovernance.invalidate('app_user_personalization');`;
    content = content.replace(upsertBlockEnd, newUpsertBlockEnd);
}

fs.writeFileSync(filePath, content, 'utf8');
