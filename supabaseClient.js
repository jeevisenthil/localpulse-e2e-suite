import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseurl = 'https://rlwxxxcerycukwyuezpv.supabase.co';
const supabasekey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsd3h4eGNlcnljdWt3eXVlenB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MTAwNDQsImV4cCI6MjA5NTM4NjA0NH0.bsnmtjXgGGoIkFp6RVl84rh8HO3ang_OqXcLDwly0w4';

const supabase = createClient(supabaseurl,supabasekey);


//TESTING
async function testConnection() {
  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .limit(1);
  if (error) {
    console.log('Supabase Connection Failed');
    console.log(error.message);
  } else {
    console.log('Supabase Connected Successfully');
    console.log(data);
  }
}
testConnection();

export default supabase;