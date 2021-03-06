run: 
	dotnet build 
	dotnet run --project backend/backend.csproj --no-build
test:
	dotnet build 
	cd frontend && npm test -- --watchAll=false && cd .. && dotnet test --no-build
build:
	dotnet build 
clean:
	dotnet clean && rm -r frontend/node_modules/
restore:
	dotnet restore
connect:
	mongo "mongodb+srv://cluster0.hzsao.mongodb.net/SWE4103_Project" --username admin
