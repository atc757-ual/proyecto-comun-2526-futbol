export interface TsdbLeague {
  idLeague: string;
  strLeague: string;
  strBadge?: string;
  strCountry?: string;
  strSport?: string;
}

export interface TsdbTeam {
  idTeam: string;
  strTeam: string;
  strTeamBadge?: string;
  strBadge?: string;
  strLeague?: string;
  strCountry?: string;
  strStadium?: string;
  strFanart1?: string;
  intFormedYear?: string | number;
}

export interface TsdbPlayer {
  idPlayer: string;
  strPlayer: string;
  strTeam?: string;
  strPosition?: string;
  strNationality?: string;
  strThumb?: string;
  strCutout?: string;
  strRender?: string;
  strBanner?: string;
  strDescriptionEN?: string;
  dateBorn?: string;
  strBirthLocation?: string;
  strHeight?: string;
  strWeight?: string;
  strSide?: string;
  strInstagram?: string;
  strFacebook?: string;
  strTwitter?: string;
  strWebsite?: string;
  strNumber?: string;
  idTeam?: string;
  idTeam2?: string;
  idLeague?: string;
}

export interface TsdbCareer {
  idTeam?: string;
  strTeam: string;
  strSeason: string;
  strTeamBadge?: string;
}

export interface TsdbHonour {
  strHonour: string;
  strSeason: string;
  strTeam?: string;
  strLeague?: string;
  strTeamBadge?: string;
}

export interface TsdbMilestone {
  strMilestone: string;
  strSeason: string;
  strTeamBadge?: string;
  strTeam?: string;
}

export interface TsdbLiveScore {
  idLiveScore?: string;
  idEvent?: string;
  strLeague?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  strHomeTeamBadge?: string;
  strAwayTeamBadge?: string;
  intHomeScore?: any;
  intAwayScore?: any;
  strStatus?: string;
  strProgress?: string;
  customGradient?: string;
}

export interface Breadcrumb {
  label: string;
  url: string;
  icon?: string;
}
