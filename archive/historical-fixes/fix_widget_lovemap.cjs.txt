const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/widgets/LoveMapWidget.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('apiGovernance')) {
  content = content.replace("import { supabase } from '../../lib/supabase';", "import { supabase } from '../../lib/supabase';\nimport { apiGovernance } from '../../lib/api-governance';");
}

const oldFetch = `        const { data } = await supabase
          .from('map_locations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        if (data && data.length > 0) {
          setLocations(data);
          setActiveLoc(data[0]);
        }`;
const newFetch = `        const data = await apiGovernance.fetchWithGovernance<any[]>(
          'repo_map_locations_all',
          async () => {
            const { data: resData, error } = await supabase
              .from('map_locations')
              .select('*')
              .order('created_at', { ascending: false });
            if (error) throw error;
            return resData || [];
          },
          { ttl: 300000 }
        );
        if (data && data.length > 0) {
          setLocations(data.slice(0, 5));
          setActiveLoc(data[0]);
        }`;

content = content.replace(oldFetch, newFetch);
fs.writeFileSync(filePath, content, 'utf8');
