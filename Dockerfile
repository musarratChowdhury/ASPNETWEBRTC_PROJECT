FROM mcr.microsoft.com/dotnet/aspnet:7.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_14.x | bash - \
    && apt-get install -y \
        nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src
COPY ["ASPNETWEBRTC_PROJECT.csproj", "./"]
RUN dotnet restore "ASPNETWEBRTC_PROJECT.csproj"
COPY . .
WORKDIR "/src/"
RUN dotnet build "ASPNETWEBRTC_PROJECT.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ASPNETWEBRTC_PROJECT.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ASPNETWEBRTC_PROJECT.dll"]
