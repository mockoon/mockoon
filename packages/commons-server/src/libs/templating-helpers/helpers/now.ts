// provide current time with format
import { format as dateFormat } from 'date-fns';

const now = function (format: any) {
  return dateFormat(
    new Date(),
    typeof format === 'string' ? format : "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
    {
      useAdditionalWeekYearTokens: true,
      useAdditionalDayOfYearTokens: true
    }
  );
};

export default now;
