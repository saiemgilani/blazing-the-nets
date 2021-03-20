# Blazing the Nets

Primarily drawn from two projects:

- [https://github.com/ledoux7/nba-d3-react](https://github.com/ledoux7/nba-d3-react)
[demo](http://react-test-123890.s3-website-us-west-1.amazonaws.com/)
  - everything else
- [Pete Beshai's nba draft app](https://github.com/pbeshai/nba-draft)
  
  - `src/api`
  - `src/containers`
  - `src/datadefs`
  - `src/state`
  - `src/url`
  - `src/utils`
  - `src/components` partially, as well as the `src/d3.js`
I haven't seen it, but it's one of his few open-source/simple to re-create projects.
He's a legend in the field for d3, JS, and used to work for the Celtics.  
[Pete's Projects](https://peterbeshai.com/#projects)

I did manage to finally start to get the NBA data I was interested in, at least locally. 
ETL contains the scripts for that and some of that data can be found in public/data/player_dashboard_year_over_year

For the time being, I have added the nba js module to the actual repo to look at how it works `nba`.

The firebase code/connections aren't mine, I wouldn't do that unprotected non-sense. Just doesn't seem super complicated. I also didn't write the docker-compose stuff, but it seemed useful enough as boilerplate if I were to want to host it there
