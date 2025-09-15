import RuleForm from './RuleForm';
import RulesList from './RulesList';

export default function App() {
  return (
    <div className="app-container">
      <div className="header">
        <div className="logo" />
        <h1>Campaign Rules Engine</h1>
      </div>
      <div className="grid">
        <div className="card">
          <RuleForm />
        </div>
        <div className="card">
          <RulesList />
        </div>
      </div>
    </div>
  );
}

